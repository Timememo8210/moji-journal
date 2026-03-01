import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: '请提供日记内容' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const systemPrompt = `Generate an artistic, minimalist illustration that captures the mood and theme of the following journal entry. Style: watercolor, soft tones, magazine-quality, abstract. Do NOT include any text or words in the image. Journal entry: ${prompt.slice(0, 1000)}`

    // Use Gemini 2.0 Flash with image generation
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            responseMimeType: 'image/png',
          },
        }),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error('Gemini API error:', res.status, errText)
      return NextResponse.json(
        { error: `图片生成失败 (${res.status})` },
        { status: 502 }
      )
    }

    const data = await res.json()

    // Extract inline image data from response
    const parts = data?.candidates?.[0]?.content?.parts
    if (!parts) {
      console.error('Unexpected response:', JSON.stringify(data).slice(0, 500))
      return NextResponse.json({ error: '未能生成图片' }, { status: 502 })
    }

    const imagePart = parts.find(
      (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
    )
    if (!imagePart?.inlineData) {
      return NextResponse.json({ error: '未能生成图片' }, { status: 502 })
    }

    const { mimeType, data: b64 } = imagePart.inlineData
    const imageUrl = `data:${mimeType};base64,${b64}`

    return NextResponse.json({ imageUrl })
  } catch (err) {
    console.error('generate-image error:', err)
    return NextResponse.json({ error: '服务异常，请稍后重试' }, { status: 500 })
  }
}
