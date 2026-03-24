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
import { useI18n } from '@/contexts/I18nContext'
import { useToast } from '@/components/Toast'

const Editor = dynamic(() => import('@/components/Editor'), { ssr: false })
const VoiceInput = dynamic(() => import('@/components/VoiceInput'), { ssr: false })

export default function NewEntry() {
  const router = useRouter()
  const { user, isConfigured, loading: authLoading } = useAuth()
  const { t } = useI18n()
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

  useEffect(() => {
    if (!authLoading && isConfigured && !user) {
      router.replace('/auth/login?redirect=/entry/new')
    }
  }, [authLoading, isConfigured, user, router])

  useEffect(() => {
    if (title.trim() || content.trim() || images.length > 0) {
      setHasUnsavedChanges(true)
    }
  }, [title, content, images])

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
      if (confirm(t('unsavedWarning'))) {
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
        showToast(data.error || t('cleanupFailed'), 'error')
        return
      }
      if (data.cleaned && confirm(t('aiCleanupConfirm'))) {
        setContent(data.cleaned)
        showToast(t('contentCleaned'))
      }
    } catch {
      showToast(navigator.onLine ? t('cleanupFailedRetry') : t('networkError'), 'error')
    } finally {
      setAiLoading(false)
    }
  }

  const handleGenerateImage = async () => {
    const text = content || title
    if (!text.trim() || generatingImage) return
    setGeneratingImage(true)
    try {
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
        imageUrl = `https://picsum.photos/seed/${Date.now()}/800/600`
      }

      const imgRes = await fetch(imageUrl, { redirect: 'follow' })
      if (!imgRes.ok) throw new Error(t('imageFailed'))
      const blob = await imgRes.blob()
      imageUrl = URL.createObjectURL(blob)
      setImages((prev) => [...prev, imageUrl])
      showToast(t('imageGenerated'))
    } catch {
      showToast(t('imageGenFailed'), 'error')
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
        await createEntry(title || t('untitled'), latestContent, images)
      } else {
        const now = new Date().toISOString()
        const newEntry: JournalEntry = {
          id: Date.now().toString(),
          title: title || t('untitled'),
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
      showToast(t('entrySaved'))
      router.push('/')
    } catch (err) {
      showToast(t('saveFailed') + ': ' + (err instanceof Error ? err.message : t('unknownError')), 'error')
      setSaving(false)
    }
  }

  if (authLoading || (isConfigured && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 dark:text-gray-500 text-sm">{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-bottom"
    >
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-journal mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="text-base text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!title.trim() && !content.trim())}
            className="text-base font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 min-h-[44px] rounded-full hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors disabled:opacity-30"
          >
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      </header>

      <main className="max-w-journal mx-auto px-6 py-8 bg-white dark:bg-gray-900 rounded-b-2xl min-h-[calc(100vh-65px)]">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('titlePlaceholder')}
          className="w-full text-2xl font-semibold placeholder-gray-300 dark:placeholder-gray-600 dark:text-white outline-none mb-6 bg-transparent"
          autoFocus
        />

        {images.length > 0 && (
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {images.map((img, i) => (
              <div key={i} className="relative flex-shrink-0 rounded-xl overflow-hidden group">
                <img src={img} alt="" className="h-32 w-auto rounded-xl object-cover" />
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

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-base text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors px-4 min-h-[44px] rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 active:bg-gray-50 dark:active:bg-gray-800"
          >
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="7" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M3 14l4-4 2 2 3-4 4 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t('addPhotos')}
          </button>
          <button
            onClick={handleAiCleanup}
            disabled={aiLoading || !content.trim()}
            className="flex items-center gap-2 text-base text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors px-4 min-h-[44px] rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 active:bg-gray-50 dark:active:bg-gray-800 disabled:opacity-30 disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700"
          >
            {aiLoading ? (
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="8" strokeLinecap="round" />
              </svg>
            ) : (
              <span className="text-lg">✨</span>
            )}
            {aiLoading ? t('aiCleaning') : t('aiCleanup')}
          </button>
          <button
            onClick={handleGenerateImage}
            disabled={generatingImage || (!content.trim() && !title.trim())}
            className="flex items-center gap-2 text-base text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors px-4 min-h-[44px] rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 active:bg-gray-50 dark:active:bg-gray-800 disabled:opacity-30 disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700"
          >
            {generatingImage ? (
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="8" strokeLinecap="round" />
              </svg>
            ) : (
              <span className="text-lg">🎨</span>
            )}
            {generatingImage ? t('generating') : t('generateImage')}
          </button>
        </div>
        {generatingImage && (
          <div className="mb-6">
            <div className="h-32 w-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center">
              <span className="text-xs text-gray-400 dark:text-gray-500">{t('aiGeneratingImage')}</span>
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

        <div className="flex items-start gap-3">
          <div className="flex-1">
            <Editor
              content={content}
              onChange={setContent}
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
