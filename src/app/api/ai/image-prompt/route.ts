import { NextRequest, NextResponse } from 'next/server'

// Simple keyword extraction from Chinese/English text without AI
function extractKeywords(text: string): string {
  // Common Chinese-to-English mood/topic mappings
  const keywordMap: Record<string, string> = {
    '开心': 'happy', '快乐': 'joy', '高兴': 'cheerful',
    '难过': 'melancholy', '伤心': 'sadness', '悲伤': 'sad',
    '生气': 'storm', '愤怒': 'fire',
    '旅行': 'travel', '旅游': 'journey', '出游': 'adventure',
    '工作': 'office', '上班': 'work', '加班': 'overtime',
    '学习': 'study', '读书': 'books', '考试': 'education',
    '吃饭': 'food', '美食': 'cuisine', '做饭': 'cooking',
    '运动': 'fitness', '跑步': 'running', '健身': 'exercise',
    '下雨': 'rain', '晴天': 'sunshine', '下雪': 'snow', '阴天': 'cloudy',
    '春天': 'spring', '夏天': 'summer', '秋天': 'autumn', '冬天': 'winter',
    '花': 'flowers', '海': 'ocean', '山': 'mountain', '湖': 'lake',
    '猫': 'cat', '狗': 'dog', '宠物': 'pet',
    '音乐': 'music', '电影': 'cinema', '阅读': 'reading',
    '朋友': 'friendship', '家人': 'family', '爱': 'love',
    '咖啡': 'coffee', '茶': 'tea',
    '夜晚': 'night', '清晨': 'morning', '日落': 'sunset', '日出': 'sunrise',
    '安静': 'peaceful', '放松': 'relax', '焦虑': 'anxiety',
    '梦想': 'dream', '希望': 'hope', '回忆': 'memory',
    '城市': 'city', '乡村': 'countryside', '公园': 'park',
  }

  const found: string[] = []
  for (const [zh, en] of Object.entries(keywordMap)) {
    if (text.includes(zh)) found.push(en)
    if (found.length >= 3) break
  }

  // Also extract any English words from the text
  const englishWords = text.match(/[a-zA-Z]{3,}/g)
  if (englishWords) {
    for (const w of englishWords.slice(0, 2)) {
      if (!found.includes(w.toLowerCase())) found.push(w.toLowerCase())
    }
  }

  return found.length > 0 ? found.slice(0, 3).join(' ') : 'nature peaceful'
}

function getMood(text: string): { mood: string; emoji: string } {
  const moods: Array<{ words: string[]; mood: string; emoji: string }> = [
    { words: ['开心', '快乐', '高兴', '幸福', '棒', '好'], mood: 'warm', emoji: '😊' },
    { words: ['难过', '伤心', '悲', '哭', '失落', '孤独'], mood: 'cool', emoji: '😢' },
    { words: ['生气', '愤怒', '烦', '讨厌'], mood: 'dark', emoji: '😤' },
    { words: ['累', '疲', '困', '忙'], mood: 'serene', emoji: '😴' },
    { words: ['期待', '兴奋', '激动'], mood: 'energetic', emoji: '✨' },
    { words: ['平静', '安静', '放松', '舒适'], mood: 'serene', emoji: '🍃' },
  ]
  for (const m of moods) {
    if (m.words.some((w) => text.includes(w))) return { mood: m.mood, emoji: m.emoji }
  }
  return { mood: 'serene', emoji: '📝' }
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    if (!text) return NextResponse.json({ error: 'no text' }, { status: 400 })

    let keywords = 'nature peaceful'
    let mood = 'serene'
    let emoji = '📝'

    const apiKey = process.env.GOOGLE_AI_API_KEY?.trim()

    if (apiKey) {
      // Use Gemini to extract keywords and mood
      try {
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

        if (response.ok) {
          const data = await response.json()
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
          const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim()
          const parsed = JSON.parse(cleaned)
          keywords = parsed.keywords || keywords
          mood = parsed.mood || mood
          emoji = parsed.emoji || emoji
        }
      } catch {
        // Fall through to local extraction
      }
    }

    // If Gemini didn't provide keywords, extract locally
    if (keywords === 'nature peaceful') {
      keywords = extractKeywords(text)
      const moodResult = getMood(text)
      mood = moodResult.mood
      emoji = moodResult.emoji
    }

    // Use picsum with a seed based on keywords for consistent results
    const seed = keywords.replace(/\s+/g, '-').toLowerCase()
    const imageUrl = `https://picsum.photos/seed/${seed}/800/600`

    return NextResponse.json({ imageUrl, keywords, mood, emoji })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
