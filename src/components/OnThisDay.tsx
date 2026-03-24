'use client'

import { useState } from 'react'
import { JournalEntry } from '@/types'
import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

interface OnThisDayProps {
  entries: JournalEntry[]
}

export default function OnThisDay({ entries }: OnThisDayProps) {
  const { t, locale } = useI18n()
  const [expanded, setExpanded] = useState(true)

  const today = new Date()
  const todayMonth = today.getMonth()
  const todayDate = today.getDate()
  const todayYear = today.getFullYear()

  const memories = entries.filter((entry) => {
    const d = new Date(entry.created_at)
    return d.getMonth() === todayMonth && d.getDate() === todayDate && d.getFullYear() !== todayYear
  }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  if (memories.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🕰️</span>
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {t('onThisDay')}
          </span>
          <span className="text-xs text-amber-600/70 dark:text-amber-400/60 bg-amber-100 dark:bg-amber-900/40 rounded-full px-2 py-0.5">
            {memories.length}
          </span>
        </div>
        <span className="text-xs text-amber-600/70 dark:text-amber-400/60">
          {expanded ? t('onThisDayCollapse') : t('onThisDayExpand')}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-3">
              {memories.map((entry) => {
                const d = new Date(entry.created_at)
                const yearsAgo = todayYear - d.getFullYear()
                const snippet = stripHtml(entry.content).slice(0, 80)
                const heroImage = entry.media?.find((m) => m.type === 'image')

                return (
                  <Link
                    key={entry.id}
                    href={`/entry/${entry.id}`}
                    className="block rounded-xl bg-white/70 dark:bg-gray-800/50 border border-amber-100 dark:border-amber-900/30 p-3 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex gap-3">
                      {heroImage && (
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden">
                          <img src={heroImage.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                            {locale === 'zh'
                              ? `${yearsAgo}${t('yearsAgoToday')}`
                              : `${yearsAgo}${t('yearsAgoToday')}`}
                          </span>
                          {entry.mood && <span className="text-xs">{entry.mood}</span>}
                        </div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {entry.title}
                        </p>
                        {snippet && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {snippet}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
