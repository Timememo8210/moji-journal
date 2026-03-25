import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const API_KEY = process.env.MOJI_API_KEY || ''

function checkAuth(req: NextRequest): boolean {
  if (!API_KEY) return false
  return req.headers.get('authorization') === `Bearer ${API_KEY}`
}

// GET /api/entries
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServerSupabaseClient()
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const date = searchParams.get('date')

  let query = supabase
    .from('entries')
    .select('*, media(*)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (date) {
    query = query.gte('created_at', `${date}T00:00:00.000Z`).lte('created_at', `${date}T23:59:59.999Z`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entries: data, count: data?.length ?? 0 })
}

// POST /api/entries
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, content, mood, images } = await req.json()
  if (!title || !content) {
    return NextResponse.json({ error: 'title and content required' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const now = new Date().toISOString()

  const insertData: Record<string, unknown> = { title, content, created_at: now, updated_at: now }
  if (mood) insertData.mood = mood

  const { data: entry, error } = await supabase
    .from('entries')
    .insert(insertData)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (images?.length && entry) {
    await supabase.from('media').insert(
      images.map((url: string, i: number) => ({
        entry_id: entry.id, type: 'image', url, position: i,
      }))
    )
  }

  return NextResponse.json({ entry }, { status: 201 })
}
