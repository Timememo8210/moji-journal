'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { JournalEntry } from '@/types'
import { mockEntries } from '@/lib/mock-data'

const Editor = dynamic(() => import('@/components/Editor'), { ssr: false })
const VoiceInput = dynamic(() => import('@/components/VoiceInput'), { ssr: false })

export default function NewEntry() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<any>(null)

  const handleVoiceTranscript = useCallback((text: string) => {
    const editor = editorRef.current
    if (editor) {
      editor.chain().focus().insertContent(text).run()
    }
  }, [])

  const handleAiCleanup = async () => {
    if (!content.trim() || aiLoading) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || '整理失败')
        return
      }
      if (data.cleaned && confirm('AI已整理完成，是否替换当前内容？')) {
        setContent(data.cleaned)
      }
    } catch {
      alert('网络错误，请稍后重试')
    } finally {
      setAiLoading(false)
    }
  }

  const handleGenerateImage = async () => {
    const text = content || title
    if (!text.trim() || generatingImage) return
    setGeneratingImage(true)
    try {
      // Use Pollinations.ai directly - completely free
      const artPrompt = `watercolor illustration, minimalist, soft pastel, no text, artistic: ${text.replace(/<[^>]*>/g, '').slice(0, 200)}`
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(artPrompt)}?width=800&height=600&nologo=true&seed=${Date.now()}`
      // Preload image to verify it loads
      await new Promise<void>((resolve, reject) => {
        const img = new window.Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = imageUrl
        setTimeout(() => reject(new Error('超时')), 30000)
      })
      setImages((prev) => [...prev, imageUrl])
    } catch {
      // Fallback: try another free service
      try {
        const text2 = (content || title).replace(/<[^>]*>/g, '').slice(0, 100)
        const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(text2)}/800/600`
        setImages((prev) => [...prev, fallbackUrl])
      } catch {
        alert('图片生成失败，请稍后重试')
      }
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages((prev) => [...prev, ev.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    // Get latest content directly from editor in case state is stale
    const latestContent = editorRef.current ? editorRef.current.getHTML() : content
    if (!title.trim() && !latestContent.trim()) return
    setSaving(true)

    try {
      const now = new Date().toISOString()
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        title: title || '无题',
        content: latestContent,
        created_at: now,
        updated_at: now,
        media: images.map((url, i) => ({
          id: `m-${Date.now()}-${i}`,
          entry_id: '',
          type: 'image' as const,
          url,
          position: i,
          created_at: now,
        })),
      }
      newEntry.media.forEach((m) => (m.entry_id = newEntry.id))

      // Save to localStorage
      const saved = localStorage.getItem('moji-entries')
      const entries: JournalEntry[] = saved ? JSON.parse(saved) : [...mockEntries]
      entries.unshift(newEntry)
      localStorage.setItem('moji-entries', JSON.stringify(entries))

      router.push('/')
    } catch (err) {
      alert('保存失败: ' + (err instanceof Error ? err.message : '存储空间可能已满'))
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-white"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-journal mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-base text-gray-400 hover:text-gray-900 transition-colors py-2 px-3"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!title.trim() && !content.trim())}
            className="text-base font-medium bg-gray-900 text-white px-6 py-2.5 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-30"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </header>

      <main className="max-w-journal mx-auto px-6 py-8">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="标题"
          className="w-full text-2xl font-semibold placeholder-gray-300 outline-none mb-6 bg-transparent"
          autoFocus
        />

        {/* Images */}
        {images.length > 0 && (
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {images.map((img, i) => (
              <div key={i} className="relative flex-shrink-0 rounded-xl overflow-hidden group">
                <img
                  src={img}
                  alt=""
                  className="h-32 w-auto rounded-xl object-cover"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-base text-gray-500 hover:text-gray-800 transition-colors px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-400 active:bg-gray-50"
          >
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="7" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M3 14l4-4 2 2 3-4 4 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            添加照片
          </button>
          <button
            onClick={handleAiCleanup}
            disabled={aiLoading || !content.trim()}
            className="flex items-center gap-2 text-base text-gray-500 hover:text-gray-800 transition-colors px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-400 active:bg-gray-50 disabled:opacity-30 disabled:hover:border-gray-200"
          >
            {aiLoading ? (
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="8" strokeLinecap="round" />
              </svg>
            ) : (
              <span className="text-lg">✨</span>
            )}
            {aiLoading ? 'AI整理中...' : 'AI整理'}
          </button>
          <button
            onClick={handleGenerateImage}
            disabled={generatingImage || (!content.trim() && !title.trim())}
            className="flex items-center gap-2 text-base text-gray-500 hover:text-gray-800 transition-colors px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-400 active:bg-gray-50 disabled:opacity-30 disabled:hover:border-gray-200"
          >
            {generatingImage ? (
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="8" strokeLinecap="round" />
              </svg>
            ) : (
              <span className="text-lg">🎨</span>
            )}
            {generatingImage ? '生成中...' : '生成配图'}
          </button>
        </div>
        {/* AI Image Generation Shimmer */}
        {generatingImage && (
          <div className="mb-6">
            <div className="h-32 w-48 rounded-xl bg-gray-100 animate-pulse flex items-center justify-center">
              <span className="text-xs text-gray-400">AI 配图生成中...</span>
            </div>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Editor with Voice Input */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <Editor
              content={content}
              onChange={setContent}
              placeholder="写点什么..."
              onEditorReady={(editor: any) => { editorRef.current = editor }}
            />
          </div>
          <div className="pt-1">
            <VoiceInput onTranscript={handleVoiceTranscript} />
          </div>
        </div>
      </main>
    </motion.div>
  )
}
