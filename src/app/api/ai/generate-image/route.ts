import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: '请提供日记内容' }, { status: 400 })
    }

    // Build an art-directed prompt
    const artPrompt = `watercolor illustration, minimalist, soft pastel tones, magazine quality, no text, artistic: ${prompt.slice(0, 300)}`
    const encodedPrompt = encodeURIComponent(artPrompt)

    // Use Pollinations.ai - completely free, no API key needed
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true&enhance=true`

    // Verify it's accessible
    const check = await fetch(imageUrl, { method: 'HEAD' })
    if (!check.ok) {
      return NextResponse.json({ error: '图片生成失败' }, { status: 502 })
    }

    return NextResponse.json({ imageUrl })
  } catch (err) {
    console.error('generate-image error:', err)
    return NextResponse.json({ error: '服务异常，请稍后重试' }, { status: 500 })
  }
}
