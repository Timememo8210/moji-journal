import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = () => !!(supabaseUrl && supabaseAnonKey)

// Singleton browser client — preserves auth session across calls
let _client: ReturnType<typeof createBrowserClient> | null = null

export function createBrowserSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase not configured')
  }
  if (!_client) {
    _client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return _client
}

// Convenience export for direct use
export const supabase = isSupabaseConfigured() ? createBrowserSupabaseClient() : null
