'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { JournalEntry } from '@/types'
import { mockEntries } from '@/lib/mock-data'
import { getEntries, deleteEntry } from '@/lib/entries'
import { isSupabaseConfigured } from '@/lib/supabase'
import { format } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import EntryCard from '@/components/EntryCard'
import UserMenu from '@/components/UserMenu'
import LandingPage from '@/components/LandingPage'
import GuestBanner from '@/components/GuestBanner'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { useToast } from '@/components/Toast'
import { SkeletonList } from '@/components/Skeleton'
import { isGuestMode, getGuestEntries } from '@/lib/guest'
import ImportDialog from '@/components/ImportDialog'
import OnThisDay from '@/components/OnThisDay'
import CalendarView from '@/components/CalendarView'
import DailyReminderBanner from '@/components/DailyReminderBanner'

export default function Timeline() {
  const router = useRouter()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterDay, setFilterDay] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showMonthNav, setShowMonthNav] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const { user, isConfigured, loading: authLoading } = useAuth()
  const { t, locale } = useI18n()
  const { showToast } = useToast()
  const [showImport, setShowImport] = useState<JournalEntry[] | null>(null)
  const monthRefs = useRef<Record<string, HTMLElement | null>>({})
  const dateFnsLocale = locale === 'zh' ? zhCN : enUS

  const guestMode = typeof window !== 'undefined' && isGuestMode()

  useEffect(() => {
    if (authLoading) return

    // Show landing page if Supabase is configured, user not logged in, and not guest mode
    if (isConfigured && !user && !isGuestMode()) {
      setMounted(true)
      return
    }

    async function loadEntries() {
      try {
        setLoadError(null)
        if (isConfigured && user) {
          const data = await getEntries()
          setEntries(data)
          // Check for guest entries to import
          const guestData = getGuestEntries()
          if (guestData) {
            try {
              const parsed = JSON.parse(guestData)
              if (Array.isArray(parsed) && parsed.length > 0) {
                setShowImport(parsed)
              }
            } catch { /* ignore */ }
          }
        } else {
          // Guest mode or no Supabase: use localStorage
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
        const message = err instanceof Error ? err.message : t('loadFailed')
        setLoadError(navigator.onLine ? message : t('networkError'))
      }
      setMounted(true)
    }
    loadEntries()
  }, [user, isConfigured, authLoading, router, t])

  const filteredEntries = entries.filter((entry) => {
    const date = new Date(entry.created_at)
    const matchesSearch = !searchQuery ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesYear = !filterYear || date.getFullYear().toString() === filterYear
    const matchesMonth = !filterMonth || (date.getMonth() + 1).toString() === filterMonth
    const matchesDay = !filterDay || date.getDate().toString() === filterDay
    return matchesSearch && matchesYear && matchesMonth && matchesDay
  })

  const years = Array.from(new Set(entries.map(e => new Date(e.created_at).getFullYear()))).sort((a, b) => b - a)

  const handleDelete = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    try {
      if (isSupabaseConfigured() && !isGuestMode()) {
        await deleteEntry(id)
      } else {
        const updated = entries.filter((e) => e.id !== id)
        localStorage.setItem('moji-entries', JSON.stringify(updated))
      }
      showToast(t('deleted'))
    } catch {
      showToast(t('deleteFailed'), 'error')
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
      const message = err instanceof Error ? err.message : t('loadFailed')
      setLoadError(navigator.onLine ? message : t('networkError'))
    }
    setMounted(true)
  }

  const scrollToMonth = (monthKey: string) => {
    const el = monthRefs.current[monthKey]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setShowMonthNav(false)
    }
  }

  const formatMonthKey = (dateStr: string) => {
    const date = new Date(dateStr)
    if (locale === 'zh') {
      return format(date, 'yyyy年M月', { locale: zhCN })
    }
    return format(date, 'MMMM yyyy', { locale: enUS })
  }

  const grouped = filteredEntries.reduce<Record<string, JournalEntry[]>>((acc, entry) => {
    const key = formatMonthKey(entry.created_at)
    if (!acc[key]) acc[key] = []
    acc[key].push(entry)
    return acc
  }, {})

  const monthKeys = Object.keys(grouped)

  const formatYear = (y: number) => locale === 'zh' ? `${y}年` : `${y}`
  const formatMonth = (m: number) => {
    if (locale === 'zh') return `${m}月`
    const date = new Date(2000, m - 1, 1)
    return format(date, 'MMMM', { locale: enUS })
  }
  const formatEntriesCount = (n: number) => locale === 'zh' ? `${n} 篇` : `${n}`

  // Show landing page for unauthenticated users when Supabase is configured
  if (mounted && isConfigured && !user && !guestMode) {
    return <LandingPage />
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-journal mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold tracking-tight dark:text-white">{t('appName')}</h1>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
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
      className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-bottom"
    >
      {/* Guest Banner */}
      <GuestBanner />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-journal mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight dark:text-white">{t('appName')}</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowCalendar(!showCalendar); setShowMonthNav(false); setShowSearch(false) }}
              className={`w-11 h-11 flex items-center justify-center transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 ${showCalendar ? 'text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              title={t('calendarView')}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="3" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 7h14" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 1v4M12 1v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="6" cy="10.5" r="1" fill="currentColor" />
                <circle cx="9" cy="10.5" r="1" fill="currentColor" />
                <circle cx="12" cy="10.5" r="1" fill="currentColor" />
              </svg>
            </button>
            {monthKeys.length > 1 && (
              <button
                onClick={() => { setShowMonthNav(!showMonthNav); setShowCalendar(false); setShowSearch(false) }}
                className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
                title={t('monthNav')}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 6h12M3 10h12M3 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
            <button
              onClick={() => { setShowSearch(!showSearch); setShowCalendar(false); setShowMonthNav(false) }}
              className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="7.5" cy="7.5" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11.5 11.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {/* Settings */}
            <Link
              href="/settings"
              className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </Link>
            <UserMenu />
          </div>
        </div>

        {/* Month quick-jump bar */}
        <AnimatePresence>
          {showMonthNav && monthKeys.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
            >
              <div className="max-w-journal mx-auto px-6 py-3">
                <div className="flex flex-wrap gap-2">
                  {monthKeys.map((monthKey) => (
                    <button
                      key={monthKey}
                      onClick={() => scrollToMonth(monthKey)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {monthKey}
                      <span className="text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                        {grouped[monthKey].length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Calendar View */}
        <AnimatePresence>
          {showCalendar && (
            <CalendarView
              entries={entries}
              onSelectDate={(dateStr) => {
                const [y, m, d] = dateStr.split('-')
                setFilterYear(y)
                setFilterMonth(String(parseInt(m)))
                setFilterDay(String(parseInt(d)))
                setShowCalendar(false)
                setShowSearch(true)
              }}
              onClose={() => setShowCalendar(false)}
            />
          )}
        </AnimatePresence>

        {/* Search & Filter Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 overflow-hidden"
            >
              <div className="max-w-journal mx-auto px-6 py-3 space-y-3">
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-base dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                  autoFocus
                />
                <div className="flex gap-3">
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:border-gray-400"
                  >
                    <option value="">{t('allYears')}</option>
                    {years.map(y => <option key={y} value={y}>{formatYear(y)}</option>)}
                  </select>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:border-gray-400"
                  >
                    <option value="">{t('allMonths')}</option>
                    {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{formatMonth(i+1)}</option>)}
                  </select>
                  {(searchQuery || filterYear || filterMonth || filterDay) && (
                    <button
                      onClick={() => { setSearchQuery(''); setFilterYear(''); setFilterMonth(''); setFilterDay('') }}
                      className="px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {t('clear')}
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
        {/* Daily Reminder Banner */}
        {!loadError && entries.length > 0 && (
          <DailyReminderBanner entries={entries} />
        )}

        {/* On This Day */}
        {!loadError && entries.length > 0 && !searchQuery && !filterYear && !filterMonth && !filterDay && (
          <OnThisDay entries={entries} />
        )}

        {loadError ? (
          <div className="text-center py-32">
            <p className="text-4xl mb-4">{navigator.onLine ? '😥' : '📡'}</p>
            <p className="text-red-400 text-sm mb-4">{loadError}</p>
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
          </div>
        ) : entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32"
          >
            <p className="text-6xl mb-6">📝</p>
            <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{t('startFirstEntry')}</h2>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">{t('startFirstEntryDesc')}</p>
            <Link
              href="/entry/new"
              className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium px-6 py-3 rounded-full hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {t('writeEntry')}
            </Link>
          </motion.div>
        ) : filteredEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32"
          >
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">{t('noResults')}</p>
            <button
              onClick={() => { setSearchQuery(''); setFilterYear(''); setFilterMonth(''); setFilterDay('') }}
              className="mt-3 text-sm text-gray-900 dark:text-white underline underline-offset-4"
            >
              {t('clearFilters')}
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {Object.entries(grouped).map(([month, monthEntries]) => (
              <motion.section
                key={month}
                ref={(el) => { monthRefs.current[month] = el }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-12 scroll-mt-20"
              >
                <div className="sticky top-[65px] z-30 -mx-6 px-6 py-3 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      {month}
                    </h2>
                    <span className="text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-0.5">
                      {formatEntriesCount(monthEntries.length)}
                    </span>
                  </div>
                </div>

                <div className="relative pl-8 mt-4">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />
                  <div className="space-y-6">
                    {monthEntries.map((entry, i) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative"
                      >
                        <div className="absolute -left-8 top-5 w-[15px] h-[15px] rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 z-10" />
                        <EntryCard entry={entry} onDelete={handleDelete} />
                      </motion.div>
                    ))}
                  </div>
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
          className="fixed right-5 safe-bottom-fab w-14 h-14 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center shadow-lg hover:bg-gray-700 dark:hover:bg-gray-200 active:scale-95 transition-all z-40"
        >
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
      )}

      {/* Import guest entries dialog */}
      {showImport && (
        <ImportDialog
          entries={showImport}
          onDone={() => {
            setShowImport(null)
            window.location.reload()
          }}
        />
      )}
    </motion.div>
  )
}
