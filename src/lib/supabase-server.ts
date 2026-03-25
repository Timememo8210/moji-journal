import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

// Bot user ID for API-created entries (sky-bot@moji.ai)
export const API_BOT_USER_ID = 'baa5318d-c016-4752-bb22-1c3c8864f2fb'

let _serverClient: SupabaseClient | null = null

/**
 * Server-side Supabase client using service_role key (bypasses RLS).
 */
export function createServerSupabaseClient(): SupabaseClient {
  if (!url) throw new Error('Supabase URL not configured')
  const key = serviceKey || anonKey
  if (!key) throw new Error('Supabase keys not configured')

  if (!_serverClient) {
    _serverClient = createClient(url, key, {
      auth: { persistSession: false },
    })
  }
  return _serverClient
}
