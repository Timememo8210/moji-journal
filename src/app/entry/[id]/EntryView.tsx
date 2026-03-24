'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent?.trim() || ''
}

function WeChatQRModal({ url, onClose, t: translate }: { url: string; onClose: () => void; t: (key: any) => string }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-4 pointer-events-auto max-w-[280px] w-full">
          <img src={qrUrl} alt="QR Code" width={200} height={200} className="rounded-lg" />
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{translate('scanToShare')}</p>
          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors min-h-[44px] px-4"
          >
            {translate('cancel')}
          </button>
        </div>
      </motion.div>
    </>
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
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showWeChatQR, setShowWeChatQR] = useState(false)
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

  const getShareText = useCallback(() => {
    if (!entry) return { title: '', text: '', preview: '' }
    const plain = stripHtml(entry.content)
    const preview = plain.length > 150 ? plain.slice(0, 150) + '...' : plain
    const date = format(new Date(entry.created_at), 'yyyy-MM-dd')
    const text = `${entry.title}\n${date}\n${preview}\n${t('shareFrom')}`
    return { title: entry.title, text, preview: plain.slice(0, 100) }
  }, [entry, t])

  const handleShare = async () => {
    if (!entry) return
    const { title, text, preview } = getShareText()
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ title, text: preview, url })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          showToast(t('shareFailed'), 'error')
        }
      }
    } else {
      setShowShareMenu(!showShareMenu)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showToast(t('linkCopied'))
    } catch {
      showToast(t('shareFailed'), 'error')
    }
    setShowShareMenu(false)
  }

  const handleShareWeibo = () => {
    if (!entry) return
    const { preview } = getShareText()
    const url = window.location.href
    const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(entry.title + ' ' + preview)}`
    window.open(weiboUrl, '_blank', 'width=600,height=500')
    setShowShareMenu(false)
  }

  const handleShareTwitter = () => {
    if (!entry) return
    const { preview } = getShareText()
    const url = window.location.href
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(entry.title + ' ' + preview)}`
    window.open(twitterUrl, '_blank', 'width=600,height=500')
    setShowShareMenu(false)
  }

  const handleShareWeChat = () => {
    setShowShareMenu(false)
    setShowWeChatQR(true)
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
            <div className="relative">
              <button
                onClick={handleShare}
                className="text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors min-h-[44px] px-3"
              >
                {t('share')}
              </button>
              {showShareMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute right-0 top-12 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-2 min-w-[160px]"
                  >
                    <button onClick={handleCopyLink} className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5l3-3M5.5 7l-1.65 1.65a2.12 2.12 0 003 3L8.5 10m-1-4l1.65-1.65a2.12 2.12 0 013 3L10.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      {t('copyLink')}
                    </button>
                    <button onClick={handleShareWeChat} className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5.8 6.4a.6.6 0 100-1.2.6.6 0 000 1.2zm3 0a.6.6 0 100-1.2.6.6 0 000 1.2zM6.6 10a.5.5 0 100-1 .5.5 0 000 1zm2.6 0a.5.5 0 100-1 .5.5 0 000 1z" fill="currentColor"/><path d="M10.5 7.2c.2 0 .3 0 .5.02A4.2 4.2 0 007.2 3C4.9 3 3 4.6 3 6.6c0 1.15.6 2.1 1.6 2.8l-.4 1.2 1.4-.7c.4.1.9.2 1.3.2h.3A3.3 3.3 0 017 9.2c0-1.1.9-2 2-2h1.5z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 9.2c0-1.3-1.3-2.4-2.8-2.4S7.4 7.9 7.4 9.2s1.3 2.4 2.8 2.4c.3 0 .6 0 .9-.1l1 .5-.3-.9c.8-.5 1.2-1.2 1.2-1.9z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {t('wechat')}
                    </button>
                    <button onClick={handleShareWeibo} className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M7 14c-3.3 0-6-1.6-6-3.6S3.7 7 7 7s6 1.8 6 3.4S10.3 14 7 14z" stroke="currentColor" strokeWidth="1"/><path d="M11 5.5a2 2 0 012 1.5m-1-3.5a4 4 0 013 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                      {t('weibo')}
                    </button>
                    <button onClick={handleShareTwitter} className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12.6 4.8c-.4.2-.8.3-1.3.3.5-.3.8-.7 1-1.3-.4.3-.9.5-1.4.6a2.3 2.3 0 00-3.9 2.1A6.5 6.5 0 012.2 4a2.3 2.3 0 00.7 3.1c-.4 0-.7-.1-1-.3a2.3 2.3 0 001.8 2.3c-.3.1-.7.1-1 0a2.3 2.3 0 002.1 1.6A4.6 4.6 0 012 12a6.5 6.5 0 003.5 1c4.2 0 6.5-3.5 6.5-6.5v-.3c.4-.3.8-.7 1.1-1.2-.4.2-.8.3-1.3.4.5-.3.9-.7 1-1.3l-.2.7z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/></svg>
                      Twitter/X
                    </button>
                  </motion.div>
                </>
              )}
            </div>
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

      {showWeChatQR && (
        <WeChatQRModal
          url={typeof window !== 'undefined' ? window.location.href : ''}
          onClose={() => setShowWeChatQR(false)}
          t={t}
        />
      )}
    </motion.div>
  )
}
