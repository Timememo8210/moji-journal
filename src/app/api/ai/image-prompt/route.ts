import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    if (!text) return NextResponse.json({ error: 'no text' }, { status: 400 })

    const apiKey = process.env.GOOGLE_AI_API_KEY?.trim()
    if (!apiKey) return NextResponse.json({ error: 'no key' }, { status: 500 })

    const systemPrompt = `You are an image prompt generator. Given a journal entry in any language, create a detailed English prompt for an AI image generator. The image should:
- Capture the mood and scene described in the journal
- Be in watercolor/illustration style with soft pastel tones
- Be artistic and magazine-quality
- NEVER include any text, words, or letters in the image
- Be specific about colors, composition, and atmosphere

Output ONLY the image prompt, nothing else. Keep it under 150 words.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text }] }],
          generationConfig: { maxOutputTokens: 300 },
        }),
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'api error' }, { status: 502 })
    }

    const data = await response.json()
    const prompt = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return NextResponse.json({ prompt })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
