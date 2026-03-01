import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    if (!text) return NextResponse.json({ error: 'no text' }, { status: 400 })

    const apiKey = process.env.GOOGLE_AI_API_KEY?.trim()
    if (!apiKey) return NextResponse.json({ error: 'no key' }, { status: 500 })

    // Use Gemini to extract keywords and mood
    const systemPrompt = `Given a journal entry, respond with a JSON object:
{"keywords": "2-3 English keywords for image search", "mood": "one of: warm, cool, dark, bright, serene, energetic", "emoji": "one relevant emoji"}
Output ONLY the JSON, nothing else.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text }] }],
          generationConfig: { maxOutputTokens: 100 },
        }),
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'api error' }, { status: 502 })
    }

    const data = await response.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
    
    // Parse the JSON response
    let keywords = 'nature peaceful'
    let mood = 'serene'
    let emoji = '📝'
    try {
      const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      keywords = parsed.keywords || keywords
      mood = parsed.mood || mood
      emoji = parsed.emoji || emoji
    } catch {}

    // Use picsum with a seed based on keywords for consistent results
    const seed = keywords.replace(/\s+/g, '-').toLowerCase()
    const imageUrl = `https://picsum.photos/seed/${seed}/800/600`

    return NextResponse.json({ imageUrl, keywords, mood, emoji })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
