'use client'

import { JournalEntry } from '@/types'
import Link from 'next/link'
import { useState } from 'react'
import { relativeCardDate } from '@/lib/relative-date'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

export default function EntryCard({
  entry,
  onDelete,
}: {
  entry: JournalEntry
  onDelete?: (id: string) => void
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const dateLabel = relativeCardDate(entry.created_at)
  const preview = stripHtml(entry.content).slice(0, 100)
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
              loading="lazy"
            />
          </div>
        )}

        <div className="p-5">
          {/* Date & mood */}
          <div className="flex items-center gap-2 mb-2">
            <time className="text-sm text-gray-400 tracking-wide">
              {dateLabel}
            </time>
            {entry.mood && (
              <span className="text-sm text-gray-400 before:content-['·'] before:mr-2">
                {entry.mood}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-medium mb-1.5 group-hover:text-accent-gold transition-colors">
            {entry.title}
          </h3>

          {/* Preview */}
          {preview && (
            <p className="text-base text-gray-500 leading-relaxed line-clamp-2">{preview}</p>
          )}

          {/* Image count & thumbnail row */}
          {entry.media && entry.media.filter(m => m.type === 'image').length > 1 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex -space-x-2">
                {entry.media.filter(m => m.type === 'image').slice(0, 3).map((img, i) => (
                  <div key={img.id} className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white">
                    <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
              <span className="text-xs text-gray-400">
                {entry.media.filter((m) => m.type === 'image').length} 张照片
              </span>
            </div>
          )}
        </div>

        {/* Delete button with confirmation */}
        {onDelete && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowConfirm(true)
              }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 backdrop-blur text-white opacity-0 group-hover:opacity-100 md:opacity-0 transition-opacity flex items-center justify-center hover:bg-black/40"
              style={{ opacity: showConfirm ? 1 : undefined }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {/* Inline confirm dialog */}
            {showConfirm && (
              <div
                className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10"
                onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
              >
                <p className="text-sm text-gray-600">确定删除这篇日记吗？</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowConfirm(false)
                    }}
                    className="px-4 py-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onDelete(entry.id)
                      setShowConfirm(false)
                    }}
                    className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </article>
    </Link>
  )
}
