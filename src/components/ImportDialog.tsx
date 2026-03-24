'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/contexts/I18nContext'
import { JournalEntry } from '@/types'
import { createEntry } from '@/lib/entries'
import { clearGuestEntries, exitGuestMode } from '@/lib/guest'
import { useToast } from '@/components/Toast'

interface ImportDialogProps {
  entries: JournalEntry[]
  onDone: () => void
}

export default function ImportDialog({ entries, onDone }: ImportDialogProps) {
  const { t } = useI18n()
  const { showToast } = useToast()
  const [importing, setImporting] = useState(false)

  const handleImport = async () => {
    setImporting(true)
    try {
      for (const entry of entries) {
        const images = entry.media?.filter(m => m.type === 'image').map(m => m.url) || []
        await createEntry(entry.title, entry.content, images)
      }
      clearGuestEntries()
      exitGuestMode()
      showToast(t('importSuccess'))
      onDone()
    } catch {
      showToast(t('importFailed'), 'error')
      setImporting(false)
    }
  }

  const handleSkip = () => {
    clearGuestEntries()
    exitGuestMode()
    onDone()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        >
          <p className="text-gray-900 dark:text-white text-sm font-medium mb-1">
            {t('importLocalEntries')}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-5">
            {entries.length} {t('entriesCount') || 'entries'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              disabled={importing}
              className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg py-2.5 text-sm
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {t('skipImport')}
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-lg py-2.5 text-sm
                         hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {importing ? t('loading') : t('importEntries')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
