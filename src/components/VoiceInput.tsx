'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
}

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : any

export default function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [lang, setLang] = useState<'zh-CN' | 'en-US'>('zh-CN')
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef<any>(null)

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
      return
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript
        }
      }
      if (transcript) {
        onTranscript(transcript)
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isListening, lang, onTranscript])

  // Stop and restart with new lang if currently listening
  const toggleLang = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    }
    setLang((prev) => (prev === 'zh-CN' ? 'en-US' : 'zh-CN'))
  }, [isListening])

  if (!supported) return null

  return (
    <div className="flex items-center gap-2">
      {/* Language toggle */}
      <button
        type="button"
        onClick={toggleLang}
        className="text-xs text-gray-400 hover:text-gray-700 transition-colors px-1.5 py-0.5 rounded border border-gray-200 hover:border-gray-400"
        title={lang === 'zh-CN' ? '切换到英文' : 'Switch to Chinese'}
      >
        {lang === 'zh-CN' ? '中' : 'EN'}
      </button>

      {/* Mic button */}
      <button
        type="button"
        onClick={toggleListening}
        className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          isListening
            ? 'bg-red-50 text-red-500'
            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
        }`}
        title={isListening ? '停止录音' : '语音输入'}
      >
        {/* Pulsing dot when recording */}
        {isListening && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        )}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5.5" y="1.5" width="5" height="9" rx="2.5" />
          <path d="M3 7.5a5 5 0 0 0 10 0" />
          <line x1="8" y1="12.5" x2="8" y2="14.5" />
        </svg>
      </button>
    </div>
  )
}
