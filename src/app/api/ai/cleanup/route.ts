import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: '请提供需要整理的文字' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI 服务未配置' }, { status: 500 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: '你是一个文字整理助手。用户会给你一段随意写的文字，可能语无伦次、中英混杂。请帮忙整理成条理清晰、语句通顺的文字。保持原意，不要添加内容。如果有多个主题，用段落分开。保持用户原来的语言（中文或英文）。',
        messages: [{ role: 'user', content: text }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', err)
      return NextResponse.json({ error: 'AI 服务暂时不可用' }, { status: 502 })
    }

    const data = await response.json()
    const cleaned = data.content?.[0]?.text || ''

    return NextResponse.json({ cleaned })
  } catch (error) {
    console.error('AI cleanup error:', error)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}
