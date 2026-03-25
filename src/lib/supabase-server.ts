import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

// Bot user for API access (email confirmed via admin API)
const BOT_EMAIL = 'sky-bot@moji.ai'
const BOT_PASSWORD = 'MojiBot2026!Secure'

let _client: SupabaseClient | null = null
let _authed = false

export function createServerSupabaseClient(): SupabaseClient {
  if (!url || !anonKey) throw new Error('Supabase not configured')
  if (!_client) {
    _client = createClient(url, anonKey, {
      auth: { persistSession: false },
    })
  }
  return _client
}

/**
 * Sign in as the bot user. Must call before any DB operations.
 * The bot user's auth.uid() will be used by the RLS trigger.
 */
export async function ensureBotAuth(): Promise<void> {
  if (_authed) return
  const client = createServerSupabaseClient()
  const { error } = await client.auth.signInWithPassword({
    email: BOT_EMAIL,
    password: BOT_PASSWORD,
  })
  if (error) throw new Error(`Bot auth failed: ${error.message}`)
  _authed = true
}
