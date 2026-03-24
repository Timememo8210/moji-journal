'use client'

import { useState, useMemo } from 'react'
import { JournalEntry } from '@/types'
import { useI18n } from '@/contexts/I18nContext'
import { format } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { motion } from 'framer-motion'

interface CalendarViewProps {
  entries: JournalEntry[]
  selectedDate?: string | null
  onSelectDate: (date: string | null) => void
  onClose: () => void
}

export default function CalendarView({ entries, selectedDate, onSelectDate, onClose }: CalendarViewProps) {
  const { t, locale } = useI18n()
  const dateFnsLocale = locale === 'zh' ? zhCN : enUS

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const entryDates = useMemo(() => {
    const dates = new Set<string>()
    entries.forEach((e) => {
      const d = new Date(e.created_at)
      dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
    })
    return dates
  }, [entries])

  const today = new Date()
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))
  const goToday = () => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))

  const monthLabel = format(currentMonth, locale === 'zh' ? 'yyyy年M月' : 'MMMM yyyy', { locale: dateFnsLocale })

  const weekDays = locale === 'zh'
    ? ['日', '一', '二', '三', '四', '五', '六']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (selectedDate === dateStr) {
      onSelectDate(null)
    } else {
      onSelectDate(dateStr)
    }
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return selectedDate === dateStr
  }

  const hasFilter = !!selectedDate

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden"
    >
      <div className="max-w-journal mx-auto px-6 py-4">
        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="w-11 h-11 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{monthLabel}</span>
              <button
                onClick={goToday}
                className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
              >
                {t('calendarToday')}
              </button>
            </div>
            <button
              onClick={nextMonth}
              className="w-11 h-11 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Week day headers */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs text-gray-400 dark:text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const key = `${year}-${month}-${day}`
              const hasEntries = entryDates.has(key)
              const isToday = key === todayKey
              const selected = isSelected(day)

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`relative w-full aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                    selected
                      ? 'bg-amber-500 text-white font-semibold'
                      : isToday
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold'
                      : hasEntries
                      ? 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium'
                      : 'text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {day}
                  {hasEntries && (
                    <span
                      className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                        selected
                          ? 'bg-white'
                          : isToday
                          ? 'bg-white dark:bg-gray-900'
                          : 'bg-amber-500 dark:bg-amber-400'
                      }`}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* "All" button to clear filter */}
          {hasFilter && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex justify-center">
              <button
                onClick={() => onSelectDate(null)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-4 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {t('calendarAll')}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
