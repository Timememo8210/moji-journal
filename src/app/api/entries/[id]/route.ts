import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const API_KEY = process.env.MOJI_API_KEY || ''

function checkAuth(req: NextRequest): boolean {
  if (!API_KEY) return false
  return req.headers.get('authorization') === `Bearer ${API_KEY}`
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from('entries').select('*, media(*)').eq('id', params.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ entry: data })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { title, content, mood } = await req.json()
  const supabase = await createServerSupabaseClient()
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (title !== undefined) updateData.title = title
  if (content !== undefined) updateData.content = content
  if (mood !== undefined) updateData.mood = mood || null
  const { data, error } = await supabase.from('entries').update(updateData).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createServerSupabaseClient()
  await supabase.from('media').delete().eq('entry_id', params.id)
  const { error } = await supabase.from('entries').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
