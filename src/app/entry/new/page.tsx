'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { JournalEntry } from '@/types'
import { mockEntries } from '@/lib/mock-data'

const Editor = dynamic(() => import('@/components/Editor'), { ssr: false })

export default function NewEntry() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages((prev) => [...prev, ev.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return
    setSaving(true)

    const now = new Date().toISOString()
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      title: title || '无题',
      content,
      created_at: now,
      updated_at: now,
      media: images.map((url, i) => ({
        id: `m-${Date.now()}-${i}`,
        entry_id: '',
        type: 'image' as const,
        url,
        position: i,
        created_at: now,
      })),
    }
    newEntry.media.forEach((m) => (m.entry_id = newEntry.id))

    // Save to localStorage
    const saved = localStorage.getItem('moji-entries')
    const entries: JournalEntry[] = saved ? JSON.parse(saved) : [...mockEntries]
    entries.unshift(newEntry)
    localStorage.setItem('moji-entries', JSON.stringify(entries))

    router.push('/')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-white"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-journal mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!title.trim() && !content.trim())}
            className="text-sm font-medium bg-gray-900 text-white px-4 py-1.5 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-30"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </header>

      <main className="max-w-journal mx-auto px-6 py-8">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="标题"
          className="w-full text-2xl font-semibold placeholder-gray-300 outline-none mb-6 bg-transparent"
          autoFocus
        />

        {/* Images */}
        {images.length > 0 && (
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {images.map((img, i) => (
              <div key={i} className="relative flex-shrink-0 rounded-xl overflow-hidden group">
                <img
                  src={img}
                  alt=""
                  className="h-32 w-auto rounded-xl object-cover"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add photo button */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="7" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M3 14l4-4 2 2 3-4 4 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          添加照片
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Editor */}
        <Editor content={content} onChange={setContent} placeholder="写点什么..." />
      </main>
    </motion.div>
  )
}
