'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { JournalEntry } from '@/types'
import { getEntry } from '@/lib/entries'
import { isSupabaseConfigured } from '@/lib/supabase'
import { mockEntries } from '@/lib/mock-data'

export default function EntryView({ id }: { id: string }) {
  const router = useRouter()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
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
    }
    load()
  }, [id])

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-gray-400 text-sm">找不到这篇日记</p>
        <button onClick={() => router.push('/')} className="text-sm text-gray-900 underline underline-offset-4">返回首页</button>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">加载中...</p>
      </div>
    )
  }

  const date = new Date(entry.created_at)
  const images = entry.media?.filter((m) => m.type === 'image') || []

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white"
    >
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-journal mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            返回
          </button>
        </div>
      </header>

      <main className="max-w-journal mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-3">
          <time className="text-sm text-gray-400 tracking-wide">
            {format(date, 'yyyy年M月d日 EEEE · HH:mm', { locale: zhCN })}
          </time>
          {entry.mood && (
            <span className="text-sm text-gray-400 ml-3 before:content-['·'] before:mr-3">
              {entry.mood}
            </span>
          )}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-2xl font-semibold mb-8 tracking-tight"
        >
          {entry.title}
        </motion.h1>

        {images.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
            <div className="rounded-2xl overflow-hidden">
              <img src={images[0].url} alt={images[0].caption || ''} className="w-full object-cover max-h-[400px]" />
            </div>
            {images[0].caption && <p className="text-xs text-gray-400 mt-2 text-center">{images[0].caption}</p>}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
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
