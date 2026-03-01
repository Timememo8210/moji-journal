'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { JournalEntry } from '@/types'
import { mockEntries } from '@/lib/mock-data'
import { exportEntries } from '@/lib/entries'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import EntryCard from '@/components/EntryCard'

export default function Timeline() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load from localStorage or mock data
    const saved = localStorage.getItem('moji-entries')
    if (saved) {
      setEntries(JSON.parse(saved))
    } else {
      setEntries(
        [...mockEntries].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      )
    }
    setMounted(true)
  }, [])

  const handleExport = () => {
    const json = exportEntries(entries)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `moji-export-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = (id: string) => {
    const updated = entries.filter((e) => e.id !== id)
    setEntries(updated)
    localStorage.setItem('moji-entries', JSON.stringify(updated))
  }

  // Group entries by month
  const grouped = entries.reduce<Record<string, JournalEntry[]>>((acc, entry) => {
    const key = format(new Date(entry.created_at), 'yyyy年M月', { locale: zhCN })
    if (!acc[key]) acc[key] = []
    acc[key].push(entry)
    return acc
  }, {})

  if (!mounted) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-journal mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">墨记</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
            >
              导出
            </button>
            <Link
              href="/entry/new"
              className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Timeline */}
      <main className="max-w-journal mx-auto px-6 py-8">
        {entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32"
          >
            <p className="text-gray-300 text-6xl mb-6">✎</p>
            <p className="text-gray-400 text-sm">还没有日记</p>
            <Link
              href="/entry/new"
              className="inline-block mt-4 text-sm text-gray-900 underline underline-offset-4"
            >
              写第一篇
            </Link>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {Object.entries(grouped).map(([month, monthEntries]) => (
              <motion.section
                key={month}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-12"
              >
                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-6">
                  {month}
                </h2>
                <div className="space-y-6">
                  {monthEntries.map((entry, i) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <EntryCard entry={entry} onDelete={handleDelete} />
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ))}
          </AnimatePresence>
        )}
      </main>
    </motion.div>
  )
}
