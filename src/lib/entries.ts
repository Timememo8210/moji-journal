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
  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false })

  if (!entries) return []

  const withMedia = await Promise.all(
    entries.map(async (entry) => {
      const { data: media } = await supabase
        .from('media')
        .select('*')
        .eq('entry_id', entry.id)
        .order('position')
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
  const { data: entry } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .single()

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
  const { data: entry } = await supabase
    .from('entries')
    .insert({ title, content, created_at: now, updated_at: now })
    .select()
    .single()

  if (entry && images.length > 0) {
    await supabase.from('media').insert(
      images.map((url, i) => ({
        entry_id: entry.id,
        type: 'image',
        url,
        position: i,
      }))
    )
  }

  return { ...entry!, media: [] }
}

export async function deleteEntry(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    localEntries = localEntries.filter((e) => e.id !== id)
    return
  }

  const supabase = getClient()
  await supabase.from('media').delete().eq('entry_id', id)
  await supabase.from('entries').delete().eq('id', id)
}

export function exportEntries(entries: JournalEntry[]): string {
  return JSON.stringify(entries, null, 2)
}
