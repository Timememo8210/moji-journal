'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { JournalEntry } from '@/types'
import { getEntry, updateEntry, deleteEntry } from '@/lib/entries'
import { isSupabaseConfigured } from '@/lib/supabase'
import { mockEntries } from '@/lib/mock-data'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { useToast } from '@/components/Toast'
import { SkeletonDetail } from '@/components/Skeleton'
import { useRelativeDate } from '@/lib/relative-date'

const Editor = dynamic(() => import('@/components/Editor'), { ssr: false })

function EntryDate({ dateStr }: { dateStr: string }) {
  const { locale } = useI18n()
  const relative = useRelativeDate(dateStr)
  const date = new Date(dateStr)
  const dayName = format(date, 'EEEE', { locale: locale === 'zh' ? zhCN : enUS })
  return (
    <time className="text-sm text-gray-400 dark:text-gray-500 tracking-wide">
      {relative} · {dayName}
    </time>
  )
}

export default function EntryView({ id }: { id: string }) {
  const router = useRouter()
  const { showToast } = useToast()
  const { t } = useI18n()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editImages, setEditImages] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [hasEditChanges, setHasEditChanges] = useState(false)
  const editorRef = useRef<any>(null)
  const { loading: authLoading, user, isConfigured } = useAuth()

  useEffect(() => {
    if (authLoading) return

    if (isConfigured && !user) {
      router.replace(`/auth/login?redirect=/entry/${id}`)
      return
    }

    async function load() {
      try {
        setLoadError(null)
        if (isSupabaseConfigured()) {
          const data = await getEntry(id)
          if (data) {
            setEntry(data)
          } else {
            setNotFound(true)
          }
        } else {
          const saved = localStorage.getItem('moji-entries')
          const entries: JournalEntry[] = saved ? JSON.parse(saved) : mockEntries
          const found = entries.find((e) => e.id === id)
          setEntry(found || null)
          if (!found) setNotFound(true)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : t('loadFailed')
        setLoadError(navigator.onLine ? message : t('networkError'))
      }
    }
    load()
  }, [id, authLoading, user, isConfigured, router, t])

  const startEditing = () => {
    if (!entry) return
    setEditTitle(entry.title)
    setEditContent(entry.content)
    setEditImages(entry.media?.filter(m => m.type === 'image').map(m => m.url) || [])
    setHasEditChanges(false)
    setEditing(true)
  }

  const cancelEditing = () => {
    if (hasEditChanges) {
      if (!confirm(t('unsavedEditWarning'))) return
    }
    setEditing(false)
  }

  const handleSave = async () => {
    if (!entry) return
    const latestContent = editorRef.current ? editorRef.current.getHTML() : editContent
    setSaving(true)
    try {
      if (isSupabaseConfigured()) {
        await updateEntry(entry.id, editTitle || t('untitled'), latestContent, editImages)
      } else {
        const saved = localStorage.getItem('moji-entries')
        const entries: JournalEntry[] = saved ? JSON.parse(saved) : []
        const idx = entries.findIndex(e => e.id === entry.id)
        if (idx !== -1) {
          entries[idx] = {
            ...entries[idx],
            title: editTitle || t('untitled'),
            content: latestContent,
            updated_at: new Date().toISOString(),
            media: editImages.map((url, i) => ({
              id: `m-${Date.now()}-${i}`,
              entry_id: entry.id,
              type: 'image' as const,
              url,
              position: i,
              created_at: entries[idx].created_at,
            })),
          }
          localStorage.setItem('moji-entries', JSON.stringify(entries))
        }
      }
      const updated = await getEntry(id)
      if (updated) setEntry(updated)
      setEditing(false)
      showToast(t('saved'))
    } catch (err) {
      showToast(t('saveFailed') + ': ' + (err instanceof Error ? err.message : t('unknownError')), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!entry) return
    setDeleting(true)
    try {
      if (isSupabaseConfigured()) {
        await deleteEntry(entry.id)
      } else {
        const saved = localStorage.getItem('moji-entries')
        const entries: JournalEntry[] = saved ? JSON.parse(saved) : []
        localStorage.setItem('moji-entries', JSON.stringify(entries.filter(e => e.id !== entry.id)))
      }
      showToast(t('deleted'))
      router.push('/')
    } catch (err) {
      showToast(t('deleteFailed') + ': ' + (err instanceof Error ? err.message : t('unknownError')), 'error')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleRetry = () => {
    setLoadError(null)
    setEntry(null)
    setNotFound(false)
    window.location.reload()
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-4xl">{navigator.onLine ? '😥' : '📡'}</p>
        <p className="text-red-400 text-sm text-center">{loadError}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 text-sm text-white bg-gray-900 dark:bg-white dark:text-gray-900 px-5 py-2.5 rounded-full hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7a6 6 0 1 1 1.06 3.39" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M1 11V7h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t('retry')}
          </button>
          <button onClick={() => router.push('/')} className="text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors min-h-[44px] px-3">
            {t('goHome')}
          </button>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-3">
        <p className="text-4xl">📄</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm">{t('notFound')}</p>
        <button onClick={() => router.push('/')} className="text-sm text-white bg-gray-900 dark:bg-white dark:text-gray-900 px-5 py-2.5 rounded-full hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors">{t('goHome')}</button>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-journal mx-auto px-6 py-4">
            <div className="w-12 h-4 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
          </div>
        </header>
        <SkeletonDetail />
      </div>
    )
  }

  const images = entry.media?.filter((m) => m.type === 'image') || []

  if (editing) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-bottom">
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-journal mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={cancelEditing}
              className="text-base text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-base font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 min-h-[44px] rounded-full hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors disabled:opacity-30"
            >
              {saving ? t('saving') : t('save')}
            </button>
          </div>
        </header>

        <main className="max-w-journal mx-auto px-6 py-8 bg-white dark:bg-gray-900 rounded-b-2xl min-h-[calc(100vh-65px)]">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => { setEditTitle(e.target.value); setHasEditChanges(true) }}
            placeholder={t('titlePlaceholder')}
            className="w-full text-2xl font-semibold placeholder-gray-300 dark:placeholder-gray-600 dark:text-white outline-none mb-6 bg-transparent"
            autoFocus
          />

          {editImages.length > 0 && (
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
              {editImages.map((img, i) => (
                <div key={i} className="relative flex-shrink-0 rounded-xl overflow-hidden group">
                  <img src={img} alt="" className="h-32 w-auto rounded-xl object-cover" />
                  <button
                    onClick={() => { setEditImages(prev => prev.filter((_, idx) => idx !== i)); setHasEditChanges(true) }}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <Editor
            content={editContent}
            onChange={(html) => { setEditContent(html); setHasEditChanges(true) }}
            onEditorReady={(editor: any) => { editorRef.current = editor }}
          />
        </main>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-bottom"
    >
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-journal mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1 min-h-[44px] pr-3"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t('back')}
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={startEditing}
              className="text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors min-h-[44px] px-3"
            >
              {t('edit')}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                disabled={deleting}
                className="text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-30 min-h-[44px] px-3"
              >
                {deleting ? t('deleting') : t('delete')}
              </button>
              {showDeleteConfirm && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDeleteConfirm(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute right-0 top-12 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 min-w-[200px]"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t('confirmDeleteEntry')}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 px-3 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {deleting ? t('deleting') : t('confirmDelete')}
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-journal mx-auto px-6 py-8 bg-white dark:bg-gray-900 rounded-b-2xl min-h-[calc(100vh-65px)]">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-3">
          <EntryDate dateStr={entry.created_at} />
          {entry.mood && (
            <span className="text-sm text-gray-400 dark:text-gray-500 ml-3 before:content-['·'] before:mr-3">
              {entry.mood}
            </span>
          )}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-2xl font-semibold mb-8 tracking-tight dark:text-white"
        >
          {entry.title}
        </motion.h1>

        {images.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
            <div className="rounded-2xl overflow-hidden">
              <img src={images[0].url} alt={images[0].caption || ''} className="w-full object-cover max-h-[400px]" />
            </div>
            {images[0].caption && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">{images[0].caption}</p>}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: entry.content }}
        />

        {images.length > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-8 grid grid-cols-2 gap-3">
            {images.slice(1).map((img) => (
              <div key={img.id} className="rounded-xl overflow-hidden">
                <img src={img.url} alt={img.caption || ''} className="w-full aspect-square object-cover" />
              </div>
            ))}
          </motion.div>
        )}
      </main>
    </motion.div>
  )
}
