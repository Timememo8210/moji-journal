import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: '请提供需要整理的文字' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'AI 服务未配置' }, { status: 500 })
    }

    const systemPrompt = '你是一个文字整理助手。用户会给你一段随意写的文字，可能语无伦次、中英混杂。请帮忙整理成条理清晰、语句通顺的文字。保持原意，不要添加内容。如果有多个主题，用段落分开。保持用户原来的语言（中文或英文）。只返回整理后的文字，不要加任何前缀说明。'

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text }] }],
          generationConfig: { maxOutputTokens: 4096 },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      console.error('Gemini API error:', response.status, err)
      return NextResponse.json({ error: `AI错误(${response.status})` }, { status: 502 })
    }

    const data = await response.json()
    const cleaned = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return NextResponse.json({ cleaned })
  } catch (error) {
    console.error('AI cleanup error:', error)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}
