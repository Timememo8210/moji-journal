'use client'

import { JournalEntry } from '@/types'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

export default function EntryCard({
  entry,
  onDelete,
}: {
  entry: JournalEntry
  onDelete?: (id: string) => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const date = new Date(entry.created_at)
  const preview = stripHtml(entry.content).slice(0, 120)
  const heroImage = entry.media?.find((m) => m.type === 'image')

  return (
    <Link href={`/entry/${entry.id}`} className="block group">
      <article className="relative rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-all hover:shadow-sm">
        {/* Hero image */}
        {heroImage && (
          <div className="aspect-[16/9] overflow-hidden bg-gray-50">
            <img
              src={heroImage.url}
              alt={heroImage.caption || ''}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
        )}

        <div className="p-5">
          {/* Date & mood */}
          <div className="flex items-center gap-2 mb-2">
            <time className="text-xs text-gray-400 tracking-wide">
              {format(date, 'M月d日 EEEE', { locale: zhCN })}
            </time>
            {entry.mood && (
              <span className="text-xs text-gray-400 before:content-['·'] before:mr-2">
                {entry.mood}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-medium mb-1.5 group-hover:text-accent-gold transition-colors">
            {entry.title}
          </h3>

          {/* Preview */}
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{preview}</p>

          {/* Image count */}
          {entry.media && entry.media.length > 1 && (
            <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="6" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M3 12l3-3 2 2 3-4 3 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {entry.media.filter((m) => m.type === 'image').length} 张照片
            </div>
          )}
        </div>

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (confirm('确定删除这篇日记吗？')) onDelete(entry.id)
            }}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/20 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/40"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </article>
    </Link>
  )
}
