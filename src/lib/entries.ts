import { JournalEntry } from '@/types'
import { createBrowserSupabaseClient, isSupabaseConfigured } from './supabase'
import { mockEntries } from './mock-data'
import { isGuestMode } from './guest'

// In-memory store for guest/mock mode — hydrate from localStorage if available
let localEntries: JournalEntry[] = (() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('moji-entries')
    if (saved) {
      try { return JSON.parse(saved) } catch { /* fall through */ }
    }
  }
  return [...mockEntries]
})()

// Check if we should use local storage (no Supabase OR guest mode)
function useLocalStorage(): boolean {
  return !isSupabaseConfigured() || isGuestMode()
}

// Persist local entries to localStorage
function persistLocal() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('moji-entries', JSON.stringify(localEntries))
  }
}

function getClient() {
  return createBrowserSupabaseClient()
}

export async function getEntries(): Promise<JournalEntry[]> {
  if (useLocalStorage()) {
    return localEntries.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  const supabase = getClient()
  const { data: entries, error } = await supabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`加载日记失败: ${error.message}`)
  }

  if (!entries) return []

  const withMedia = await Promise.all(
    entries.map(async (entry: Record<string, unknown>) => {
      const { data: media, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .eq('entry_id', entry.id)
        .order('position')
      if (mediaError) {
        console.warn(`加载媒体失败 (entry ${entry.id}):`, mediaError.message)
      }
      return { ...entry, media: media || [] }
    })
  )

  return withMedia
}

export async function getEntry(id: string): Promise<JournalEntry | null> {
  if (useLocalStorage()) {
    return localEntries.find((e) => e.id === id) || null
  }

  const supabase = getClient()
  const { data: entry, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(`加载日记失败: ${error.message}`)
  }

  if (!entry) return null

  const { data: media } = await supabase
    .from('media')
    .select('*')
    .eq('entry_id', id)
    .order('position')

  return { ...entry, media: media || [] }
}

export async function createEntry(
  title: string,
  content: string,
  images: string[]
): Promise<JournalEntry> {
  const now = new Date().toISOString()

  if (useLocalStorage()) {
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      title,
      content,
      created_at: now,
      updated_at: now,
      media: images.map((url, i) => ({
        id: `m-${Date.now()}-${i}`,
        entry_id: '',
        type: 'image' as const,
        url,
        position: i,
        created_at: now,
      })),
    }
    newEntry.media.forEach((m) => (m.entry_id = newEntry.id))
    localEntries.unshift(newEntry)
    persistLocal()
    return newEntry
  }

  const supabase = getClient()
  const { data: entry, error } = await supabase
    .from('entries')
    .insert({ title, content, created_at: now, updated_at: now })
    .select()
    .single()

  if (error) {
    throw new Error(`保存日记失败: ${error.message}`)
  }

  if (entry && images.length > 0) {
    const { error: mediaError } = await supabase.from('media').insert(
      images.map((url, i) => ({
        entry_id: entry.id,
        type: 'image',
        url,
        position: i,
      }))
    )
    if (mediaError) {
      console.warn('保存图片失败:', mediaError.message)
    }
  }

  return { ...entry!, media: [] }
}

export async function updateEntry(
  id: string,
  title: string,
  content: string,
  images: string[]
): Promise<JournalEntry> {
  const now = new Date().toISOString()

  if (useLocalStorage()) {
    const idx = localEntries.findIndex((e) => e.id === id)
    if (idx === -1) throw new Error('日记不存在')
    localEntries[idx] = {
      ...localEntries[idx],
      title,
      content,
      updated_at: now,
      media: images.map((url, i) => ({
        id: `m-${Date.now()}-${i}`,
        entry_id: id,
        type: 'image' as const,
        url,
        position: i,
        created_at: now,
      })),
    }
    persistLocal()
    return localEntries[idx]
  }

  const supabase = getClient()
  const { data: entry, error } = await supabase
    .from('entries')
    .update({ title, content, updated_at: now })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`更新日记失败: ${error.message}`)
  }

  // Replace media: delete old, insert new
  await supabase.from('media').delete().eq('entry_id', id)
  if (images.length > 0) {
    await supabase.from('media').insert(
      images.map((url, i) => ({
        entry_id: id,
        type: 'image',
        url,
        position: i,
      }))
    )
  }

  return { ...entry!, media: [] }
}

export async function deleteEntry(id: string): Promise<void> {
  if (useLocalStorage()) {
    localEntries = localEntries.filter((e) => e.id !== id)
    persistLocal()
    return
  }

  const supabase = getClient()
  const { error: mediaError } = await supabase.from('media').delete().eq('entry_id', id)
  if (mediaError) {
    console.warn('删除媒体失败:', mediaError.message)
  }
  const { error } = await supabase.from('entries').delete().eq('id', id)
  if (error) {
    throw new Error(`删除日记失败: ${error.message}`)
  }
}

export function exportEntries(entries: JournalEntry[]): string {
  return JSON.stringify(entries, null, 2)
}
