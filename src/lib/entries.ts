import { JournalEntry } from '@/types'
import { createBrowserSupabaseClient, isSupabaseConfigured } from './supabase'
import { mockEntries } from './mock-data'

// In-memory store for guest/mock mode
let localEntries = [...mockEntries]

function getClient() {
  return createBrowserSupabaseClient()
}

export async function getEntries(): Promise<JournalEntry[]> {
  if (!isSupabaseConfigured()) {
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
  if (!isSupabaseConfigured()) {
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

  if (!isSupabaseConfigured()) {
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

export async function deleteEntry(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    localEntries = localEntries.filter((e) => e.id !== id)
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
