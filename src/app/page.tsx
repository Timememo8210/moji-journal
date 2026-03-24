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
import { useToast } from '@/components/Toast'
import { SkeletonList } from '@/components/Skeleton'

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
  const { showToast } = useToast()

  useEffect(() => {
    if (authLoading) return

    // Redirect to login if Supabase is configured but user is not logged in
    if (isConfigured && !user) {
      router.replace('/auth/login?redirect=/')
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
        const message = err instanceof Error ? err.message : '加载失败'
        setLoadError(navigator.onLine ? message : '网络连接失败，请检查网络后重试')
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
    showToast('导出成功')
  }

  const handleDelete = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    try {
      if (isSupabaseConfigured()) {
        await deleteEntry(id)
      } else {
        const updated = entries.filter((e) => e.id !== id)
        localStorage.setItem('moji-entries', JSON.stringify(updated))
      }
      showToast('已删除')
    } catch {
      showToast('删除失败', 'error')
    }
  }

  const handleRetry = async () => {
    setLoadError(null)
    setMounted(false)
    try {
      if (isConfigured) {
        const data = await getEntries()
        setEntries(data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载失败'
      setLoadError(navigator.onLine ? message : '网络连接失败，请检查网络后重试')
    }
    setMounted(true)
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
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="max-w-journal mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold tracking-tight">墨记</h1>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
            </div>
          </div>
        </header>
        <main className="max-w-journal mx-auto px-6 py-8">
          <SkeletonList />
        </main>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white safe-bottom"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-journal mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">墨记</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50 active:bg-gray-100"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="7.5" cy="7.5" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11.5 11.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={handleExport}
              className="h-11 px-3 text-sm text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50 active:bg-gray-100"
            >
              导出
            </button>
            <UserMenu />
          </div>
        </div>

        {/* Search & Filter Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-50 bg-gray-50/50 overflow-hidden"
            >
              <div className="max-w-journal mx-auto px-6 py-3 space-y-3">
                {/* Search input */}
                <input
                  type="text"
                  placeholder="搜索日记内容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-base placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                  autoFocus
                />
                {/* Date filters */}
                <div className="flex gap-3">
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 focus:outline-none focus:border-gray-400"
                  >
                    <option value="">全部年份</option>
                    {years.map(y => <option key={y} value={y}>{y}年</option>)}
                  </select>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 focus:outline-none focus:border-gray-400"
                  >
                    <option value="">全部月份</option>
                    {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}月</option>)}
                  </select>
                  {(searchQuery || filterYear || filterMonth) && (
                    <button
                      onClick={() => { setSearchQuery(''); setFilterYear(''); setFilterMonth('') }}
                      className="px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      清除
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Timeline */}
      <main className="max-w-journal mx-auto px-6 py-8 pb-28">
        {loadError ? (
          <div className="text-center py-32">
            <p className="text-4xl mb-4">{navigator.onLine ? '😥' : '📡'}</p>
            <p className="text-red-400 text-sm mb-4">{loadError}</p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 text-sm text-white bg-gray-900 px-5 py-2.5 rounded-full hover:bg-gray-700 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7a6 6 0 1 1 1.06 3.39" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M1 11V7h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              重试
            </button>
          </div>
        ) : entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32"
          >
            <p className="text-6xl mb-6">📝</p>
            <h2 className="text-lg font-medium text-gray-800 mb-2">开始你的第一篇日记</h2>
            <p className="text-gray-400 text-sm mb-6">记录生活中的点点滴滴，留住珍贵的回忆</p>
            <Link
              href="/entry/new"
              className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-gray-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              写日记
            </Link>
          </motion.div>
        ) : filteredEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32"
          >
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-400 text-sm">没有找到匹配的日记</p>
            <button
              onClick={() => { setSearchQuery(''); setFilterYear(''); setFilterMonth('') }}
              className="mt-3 text-sm text-gray-900 underline underline-offset-4"
            >
              清除筛选
            </button>
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

      {/* Floating Action Button */}
      {entries.length > 0 && (
        <Link
          href="/entry/new"
          className="fixed right-5 safe-bottom-fab w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg hover:bg-gray-700 active:scale-95 transition-all z-40"
        >
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
      )}
    </motion.div>
  )
}
