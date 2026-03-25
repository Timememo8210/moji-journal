import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, API_BOT_USER_ID } from '@/lib/supabase-server'

const API_KEY = process.env.MOJI_API_KEY || ''

function checkAuth(req: NextRequest): boolean {
  if (!API_KEY) return false
  const auth = req.headers.get('authorization') || ''
  return auth === `Bearer ${API_KEY}`
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// GET /api/entries — list entries
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized()

  const supabase = createServerSupabaseClient()
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
    const start = `${date}T00:00:00.000Z`
    const end = `${date}T23:59:59.999Z`
    query = query.gte('created_at', start).lte('created_at', end)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ entries: data, count: data?.length ?? 0 })
}

// POST /api/entries — create entry
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized()

  const body = await req.json()
  const { title, content, mood, images, user_id } = body

  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const now = new Date().toISOString()

  const insertData: Record<string, unknown> = {
    title,
    content,
    user_id: user_id || API_BOT_USER_ID,
    created_at: now,
    updated_at: now,
  }
  if (mood) insertData.mood = mood

  const { data: entry, error } = await supabase
    .from('entries')
    .insert(insertData)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (images && images.length > 0 && entry) {
    await supabase.from('media').insert(
      images.map((url: string, i: number) => ({
        entry_id: entry.id,
        type: 'image',
        url,
        position: i,
      }))
    )
  }

  return NextResponse.json({ entry }, { status: 201 })
}
