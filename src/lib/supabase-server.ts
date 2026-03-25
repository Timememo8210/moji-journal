import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client using service role key (bypasses RLS)
// Used only in API routes — never exposed to browser
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase server config missing')
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}
