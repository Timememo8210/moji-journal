import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    hasMojiKey: !!process.env.MOJI_API_KEY,
    mojiKeyLen: (process.env.MOJI_API_KEY || '').length,
    hasSupaUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  })
}
