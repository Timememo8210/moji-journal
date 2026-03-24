'use client'

import { useI18n } from '@/contexts/I18nContext'

const MOODS = ['😊', '😔', '😤', '😴', '😍', '🤔', '😰', '🎉']

interface MoodPickerProps {
  value?: string
  onChange: (mood: string) => void
}

export default function MoodPicker({ value, onChange }: MoodPickerProps) {
  const { t } = useI18n()

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-400 dark:text-gray-500 mr-1">{t('mood')}:</span>
      {MOODS.map((mood) => (
        <button
          key={mood}
          type="button"
          onClick={() => onChange(value === mood ? '' : mood)}
          className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all ${
            value === mood
              ? 'bg-gray-100 dark:bg-gray-700 ring-2 ring-gray-300 dark:ring-gray-500 scale-110'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800 opacity-60 hover:opacity-100'
          }`}
        >
          {mood}
        </button>
      ))}
    </div>
  )
}
