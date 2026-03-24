'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useI18n } from '@/contexts/I18nContext'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onInterim?: (text: string) => void
}

export default function VoiceInput({ onTranscript, onInterim }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [lang, setLang] = useState<'zh-CN' | 'en-US'>('zh-CN')
  const [supported, setSupported] = useState(true)
  const [interim, setInterim] = useState('')
  const recognitionRef = useRef<any>(null)
  const { t } = useI18n()

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupported(false)
    }
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      setInterim('')
      return
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let interimText = ''
      let finalText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalText += transcript
        } else {
          interimText += transcript
        }
      }
      if (finalText) {
        onTranscript(finalText)
        setInterim('')
      } else {
        setInterim(interimText)
        onInterim?.(interimText)
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
      setInterim('')
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterim('')
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isListening, lang, onTranscript, onInterim])

  const toggleLang = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      setInterim('')
    }
    setLang((prev) => (prev === 'zh-CN' ? 'en-US' : 'zh-CN'))
  }, [isListening])

  if (!supported) return null

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleLang}
          className="text-sm font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
          title={lang === 'zh-CN' ? t('switchToEnglish') : t('switchToChinese')}
        >
          {lang === 'zh-CN' ? '中' : 'EN'}
        </button>

        <button
          type="button"
          onClick={toggleListening}
          className={`relative min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
            isListening
              ? 'bg-red-50 dark:bg-red-900/30 text-red-500 border border-red-200 dark:border-red-800'
              : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700'
          }`}
          title={isListening ? t('stopRecording') : t('voiceInput')}
        >
          {isListening && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          )}
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5.5" y="1.5" width="5" height="9" rx="2.5" />
            <path d="M3 7.5a5 5 0 0 0 10 0" />
            <line x1="8" y1="12.5" x2="8" y2="14.5" />
          </svg>
        </button>
      </div>

      {interim && (
        <div className="text-sm text-gray-400 dark:text-gray-500 italic bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg max-w-[250px] truncate">
          {interim}...
        </div>
      )}
    </div>
  )
}
