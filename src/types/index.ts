export interface JournalEntry {
  id: string
  title: string
  content: string
  raw_content?: string
  mood?: string
  created_at: string
  updated_at: string
  media: MediaItem[]
}

export interface MediaItem {
  id: string
  entry_id: string
  type: 'image' | 'audio'
  url: string
  caption?: string
  position: number
  created_at: string
}
