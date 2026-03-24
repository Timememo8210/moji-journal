'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { JournalEntry } from '@/types'
import { useI18n } from '@/contexts/I18nContext'

interface DailyReminderBannerProps {
  entries: JournalEntry[]
}

export default function DailyReminderBanner({ entries }: DailyReminderBannerProps) {
  const { t } = useI18n()
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if reminder is enabled
    const enabled = localStorage.getItem('moji-reminder-enabled')
    if (enabled !== 'true') return

    const reminderTime = localStorage.getItem('moji-reminder-time') || '21:00'
    const [hours, minutes] = reminderTime.split(':').map(Number)

    const now = new Date()
    const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)

    // Only show if current time is past the reminder time
    if (now < reminderDate) return

    // Check if already shown/dismissed today
    const shownDate = localStorage.getItem('moji-reminder-shown-date')
    const todayStr = now.toISOString().split('T')[0]
    if (shownDate === todayStr) return

    // Check if user has written an entry today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    const hasEntryToday = entries.some((e) => {
      const d = new Date(e.created_at)
      return d >= todayStart && d < todayEnd
    })

    if (!hasEntryToday) {
      setShow(true)
    }
  }, [entries])

  const handleDismiss = () => {
    setDismissed(true)
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem('moji-reminder-shown-date', today)
    setTimeout(() => setShow(false), 300)
  }

  if (!show) return null

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-6 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/20 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">
              {t('noEntryTodayBanner')}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/entry/new"
                className="text-xs font-medium text-white bg-amber-600 dark:bg-amber-500 px-4 py-2 rounded-full hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors min-h-[44px] flex items-center"
              >
                {t('writeNow')}
              </Link>
              <button
                onClick={handleDismiss}
                className="text-amber-600/70 dark:text-amber-400/60 hover:text-amber-800 dark:hover:text-amber-300 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={t('dismissReminder')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
