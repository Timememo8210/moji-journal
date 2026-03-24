'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { JournalEntry } from '@/types'
import { mockEntries } from '@/lib/mock-data'
import { getEntries, deleteEntry, exportEntries } from '@/lib/entries'
import { isSupabaseConfigured } from '@/lib/supabase'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import EntryCard from '@/components/EntryCard'
import UserMenu from '@/components/UserMenu'
import { useAuth } from '@/contexts/AuthContext'

export default function Timeline() {
  const router = useRouter()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const { user, isConfigured, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return

    // Redirect to login if Supabase is configured but user is not logged in
    if (isConfigured && !user) {
      router.replace('/auth/login')
      return
    }

    async function loadEntries() {
      try {
        setLoadError(null)
        if (isConfigured) {
          // Load from Supabase (user-specific via RLS)
          const data = await getEntries()
          setEntries(data)
        } else {
          // Fallback: localStorage or mock data
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
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : '加载失败')
      }
      setMounted(true)
    }
    loadEntries()
  }, [user, isConfigured, authLoading, router])

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const date = new Date(entry.created_at)
    const matchesSearch = !searchQuery || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesYear = !filterYear || date.getFullYear().toString() === filterYear
    const matchesMonth = !filterMonth || (date.getMonth() + 1).toString() === filterMonth
    return matchesSearch && matchesYear && matchesMonth
  })

  // Get available years from entries
  const years = Array.from(new Set(entries.map(e => new Date(e.created_at).getFullYear()))).sort((a, b) => b - a)

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

  const handleDelete = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    if (isSupabaseConfigured()) {
      await deleteEntry(id)
    } else {
      const updated = entries.filter((e) => e.id !== id)
      localStorage.setItem('moji-entries', JSON.stringify(updated))
    }
  }

  // Group entries by month
  const grouped = filteredEntries.reduce<Record<string, JournalEntry[]>>((acc, entry) => {
    const key = format(new Date(entry.created_at), 'yyyy年M月', { locale: zhCN })
    if (!acc[key]) acc[key] = []
    acc[key].push(entry)
    return acc
  }, {})

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">加载中...</p>
        </div>
      </div>
    )
  }

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
              onClick={() => setShowSearch(!showSearch)}
              className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="7.5" cy="7.5" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11.5 11.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
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
            <UserMenu />
          </div>
        </div>
        
        {/* Search & Filter Bar */}
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-50 bg-gray-50/50"
          >
            <div className="max-w-journal mx-auto px-6 py-3 space-y-3">
              {/* Search input */}
              <input
                type="text"
                placeholder="搜索日记内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-base placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                autoFocus
              />
              {/* Date filters */}
              <div className="flex gap-3">
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 focus:outline-none focus:border-gray-400"
                >
                  <option value="">全部年份</option>
                  {years.map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 focus:outline-none focus:border-gray-400"
                >
                  <option value="">全部月份</option>
                  {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}月</option>)}
                </select>
                {(searchQuery || filterYear || filterMonth) && (
                  <button
                    onClick={() => { setSearchQuery(''); setFilterYear(''); setFilterMonth('') }}
                    className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    清除
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* Timeline */}
      <main className="max-w-journal mx-auto px-6 py-8">
        {loadError ? (
          <div className="text-center py-32">
            <p className="text-red-400 text-sm mb-4">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-gray-900 underline underline-offset-4"
            >
              重试
            </button>
          </div>
        ) : entries.length === 0 ? (
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
