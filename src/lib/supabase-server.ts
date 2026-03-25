import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
const adminKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim() // sb_secret_ key

// 晓波's email for API-created entries
const XIAOBO_EMAIL = 'bobomail2000@hotmail.com'

let _anonClient: SupabaseClient | null = null
let _adminClient: SupabaseClient | null = null
let _userClient: SupabaseClient | null = null
let _userTokenExpiry = 0

function getAnonClient(): SupabaseClient {
  if (!_anonClient) _anonClient = createClient(url, anonKey, { auth: { persistSession: false } })
  return _anonClient
}

function getAdminClient(): SupabaseClient {
  if (!_adminClient) _adminClient = createClient(url, adminKey, { auth: { persistSession: false } })
  return _adminClient
}

/**
 * Returns a Supabase client authenticated as 晓波.
 * Uses Admin API to generate a magic link OTP, then verifies it to get a session.
 * The session is cached until it expires.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  if (!url || !anonKey) throw new Error('Supabase not configured')

  // Return cached client if token still valid (with 5-min buffer)
  if (_userClient && Date.now() < _userTokenExpiry - 5 * 60 * 1000) {
    return _userClient
  }

  if (!adminKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')

  // Generate magic link OTP for 晓波 via Admin API
  const adminClient = getAdminClient()
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: XIAOBO_EMAIL,
  })

  if (linkError || !linkData?.properties?.email_otp) {
    throw new Error(`Failed to generate magic link: ${linkError?.message}`)
  }

  const otp = linkData.properties.email_otp

  // Verify OTP to get user session
  const anonClient = getAnonClient()
  const { data: sessionData, error: sessionError } = await anonClient.auth.verifyOtp({
    email: XIAOBO_EMAIL,
    token: otp,
    type: 'email',
  })

  if (sessionError || !sessionData?.session) {
    throw new Error(`Failed to verify OTP: ${sessionError?.message}`)
  }

  const { access_token, expires_in } = sessionData.session
  _userTokenExpiry = Date.now() + (expires_in || 3600) * 1000

  // Create a client with the user's access token
  _userClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: { Authorization: `Bearer ${access_token}` },
    },
  })

  return _userClient
}
