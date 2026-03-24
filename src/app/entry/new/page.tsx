'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { JournalEntry } from '@/types'
import { mockEntries } from '@/lib/mock-data'
import { createEntry } from '@/lib/entries'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/Toast'

const Editor = dynamic(() => import('@/components/Editor'), { ssr: false })
const VoiceInput = dynamic(() => import('@/components/VoiceInput'), { ssr: false })

export default function NewEntry() {
  const router = useRouter()
  const { user, isConfigured, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<any>(null)

  // Redirect to login if Supabase is configured but user is not logged in
  useEffect(() => {
    if (!authLoading && isConfigured && !user) {
      router.replace('/auth/login?redirect=/entry/new')
    }
  }, [authLoading, isConfigured, user, router])

  // Track unsaved changes
  useEffect(() => {
    if (title.trim() || content.trim() || images.length > 0) {
      setHasUnsavedChanges(true)
    }
  }, [title, content, images])

  // Warn on browser navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (confirm('还有未保存的内容，确定要离开吗？')) {
        router.back()
      }
    } else {
      router.back()
    }
  }

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
        showToast(data.error || '整理失败', 'error')
        return
      }
      if (data.cleaned && confirm('AI已整理完成，是否替换当前内容？')) {
        setContent(data.cleaned)
        showToast('内容已整理')
      }
    } catch {
      showToast(navigator.onLine ? '整理失败，请稍后重试' : '网络连接失败', 'error')
    } finally {
      setAiLoading(false)
    }
  }

  const handleGenerateImage = async () => {
    const text = content || title
    if (!text.trim() || generatingImage) return
    setGeneratingImage(true)
    try {
      // Step 1: AI extracts keywords from journal text
      const res = await fetch('/api/ai/image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.replace(/<[^>]*>/g, '').slice(0, 500) }),
      })

      let imageUrl = ''
      if (res.ok) {
        const data = await res.json()
        imageUrl = data.imageUrl || ''
      }

      if (!imageUrl) {
        imageUrl = `https://source.unsplash.com/800x600/?journal,aesthetic`
      }

      // Verify the image loads
      await new Promise<void>((resolve, reject) => {
        const img = new window.Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = imageUrl
        setTimeout(() => resolve(), 10000)
      })
      setImages((prev) => [...prev, imageUrl])
      showToast('配图已生成')
    } catch {
      showToast('配图获取失败，请稍后重试', 'error')
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
    const latestContent = editorRef.current ? editorRef.current.getHTML() : content
    if (!title.trim() && !latestContent.trim()) return
    setSaving(true)

    try {
      if (isSupabaseConfigured()) {
        // Save to Supabase (user_id set automatically via trigger)
        await createEntry(title || '无题', latestContent, images)
      } else {
        // Fallback: localStorage
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
        const saved = localStorage.getItem('moji-entries')
        const entries: JournalEntry[] = saved ? JSON.parse(saved) : [...mockEntries]
        entries.unshift(newEntry)
        localStorage.setItem('moji-entries', JSON.stringify(entries))
      }
      setHasUnsavedChanges(false)
      showToast('日记已保存')
      router.push('/')
    } catch (err) {
      showToast('保存失败: ' + (err instanceof Error ? err.message : '未知错误'), 'error')
      setSaving(false)
    }
  }

  // Show loading while checking auth
  if (authLoading || (isConfigured && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-50 safe-bottom"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-journal mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="text-base text-gray-400 hover:text-gray-900 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!title.trim() && !content.trim())}
            className="text-base font-medium bg-gray-900 text-white px-6 min-h-[44px] rounded-full hover:bg-gray-700 transition-colors disabled:opacity-30"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </header>

      <main className="max-w-journal mx-auto px-6 py-8 bg-white rounded-b-2xl min-h-[calc(100vh-65px)]">
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
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
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
            className="flex items-center gap-2 text-base text-gray-500 hover:text-gray-800 transition-colors px-4 min-h-[44px] rounded-xl border border-gray-200 hover:border-gray-400 active:bg-gray-50"
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
            className="flex items-center gap-2 text-base text-gray-500 hover:text-gray-800 transition-colors px-4 min-h-[44px] rounded-xl border border-gray-200 hover:border-gray-400 active:bg-gray-50 disabled:opacity-30 disabled:hover:border-gray-200"
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
            className="flex items-center gap-2 text-base text-gray-500 hover:text-gray-800 transition-colors px-4 min-h-[44px] rounded-xl border border-gray-200 hover:border-gray-400 active:bg-gray-50 disabled:opacity-30 disabled:hover:border-gray-200"
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
