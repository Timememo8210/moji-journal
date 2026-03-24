'use client'

import { useEffect, useRef } from 'react'
import { JournalEntry } from '@/types'
import { format } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'

interface PrintExportProps {
  entries: JournalEntry[]
  locale: 'zh' | 'en'
  userName?: string
}

export function triggerPrint() {
  window.print()
}

export default function PrintExport({ entries, locale, userName }: PrintExportProps) {
  const dateFnsLocale = locale === 'zh' ? zhCN : enUS
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    if (locale === 'zh') {
      return format(date, 'yyyy年M月d日 EEEE', { locale: zhCN })
    }
    return format(date, 'EEEE, MMMM d, yyyy', { locale: enUS })
  }

  const exportDate = locale === 'zh'
    ? format(new Date(), 'yyyy年M月d日', { locale: zhCN })
    : format(new Date(), 'MMMM d, yyyy', { locale: enUS })

  return (
    <>
      <style jsx global>{`
        @media print {
          /* Hide everything except print content */
          body > *:not(#moji-print-root) {
            display: none !important;
          }
          #moji-print-root {
            display: block !important;
            position: static !important;
          }

          @page {
            margin: 2cm 2.5cm;
            size: A4;
            @bottom-center {
              content: counter(page);
            }
          }

          .print-cover {
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 85vh;
            text-align: center;
          }

          .print-toc {
            page-break-after: always;
          }

          .print-entry {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          .print-entry-divider {
            page-break-before: auto;
          }

          .print-entry img {
            max-width: 100%;
            max-height: 400px;
            object-fit: contain;
            page-break-inside: avoid;
          }
        }

        /* Always hidden on screen */
        #moji-print-root {
          display: none;
        }
      `}</style>

      <div id="moji-print-root">
        {/* Cover Page */}
        <div className="print-cover">
          <div style={{
            fontFamily: '"Songti SC", "STSong", Georgia, "Noto Serif SC", serif',
          }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: 300,
              letterSpacing: '8px',
              marginBottom: '8px',
              color: '#1a1a1a',
            }}>
              墨记
            </h1>
            <p style={{
              fontSize: '18px',
              color: '#888',
              letterSpacing: '4px',
              marginBottom: '80px',
            }}>
              M O J I
            </p>
            <div style={{
              width: '40px',
              height: '1px',
              background: '#ccc',
              margin: '0 auto 40px',
            }} />
            {userName && (
              <p style={{
                fontSize: '16px',
                color: '#666',
                marginBottom: '12px',
              }}>
                {userName}
              </p>
            )}
            <p style={{
              fontSize: '14px',
              color: '#999',
              marginBottom: '8px',
            }}>
              {exportDate}
            </p>
            <p style={{
              fontSize: '14px',
              color: '#999',
            }}>
              {locale === 'zh'
                ? `共 ${sortedEntries.length} 篇日记`
                : `${sortedEntries.length} entries`}
            </p>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="print-toc" style={{
          fontFamily: '"Songti SC", "STSong", Georgia, "Noto Serif SC", serif',
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 600,
            marginBottom: '32px',
            color: '#1a1a1a',
            letterSpacing: '2px',
          }}>
            {locale === 'zh' ? '目录' : 'Contents'}
          </h2>
          <div style={{ lineHeight: '2.2' }}>
            {sortedEntries.map((entry, i) => {
              const date = new Date(entry.created_at)
              const shortDate = locale === 'zh'
                ? format(date, 'M月d日', { locale: zhCN })
                : format(date, 'MMM d', { locale: enUS })
              return (
                <div key={entry.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  borderBottom: '1px dotted #ddd',
                  paddingBottom: '2px',
                  fontSize: '13px',
                }}>
                  <span style={{ color: '#333', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '16px' }}>
                    {entry.title}
                  </span>
                  <span style={{ color: '#999', flexShrink: 0, fontSize: '12px' }}>
                    {shortDate}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Entries */}
        {sortedEntries.map((entry, i) => (
          <div key={entry.id} className="print-entry" style={{
            fontFamily: '"Songti SC", "STSong", Georgia, "Noto Serif SC", serif',
            marginBottom: '48px',
          }}>
            {/* Date */}
            <p style={{
              fontSize: '13px',
              color: '#999',
              letterSpacing: '1px',
              marginBottom: '8px',
            }}>
              {formatDate(entry.created_at)}
            </p>

            {/* Title */}
            <h2 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#1a1a1a',
              marginBottom: '20px',
              lineHeight: 1.4,
            }}>
              {entry.title}
            </h2>

            {/* Images */}
            {entry.media && entry.media.filter(m => m.type === 'image').length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                {entry.media.filter(m => m.type === 'image').map((media) => (
                  <div key={media.id} style={{ marginBottom: '12px' }}>
                    <img
                      src={media.url}
                      alt={media.caption || ''}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '400px',
                        objectFit: 'contain',
                        borderRadius: '4px',
                      }}
                    />
                    {media.caption && (
                      <p style={{
                        fontSize: '12px',
                        color: '#999',
                        marginTop: '6px',
                        textAlign: 'center',
                        fontStyle: 'italic',
                      }}>
                        {media.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Content */}
            <div
              style={{
                fontSize: '15px',
                lineHeight: 1.8,
                color: '#333',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
              dangerouslySetInnerHTML={{ __html: entry.content }}
            />

            {/* Divider */}
            {i < sortedEntries.length - 1 && (
              <div className="print-entry-divider" style={{
                width: '40px',
                height: '1px',
                background: '#ddd',
                margin: '48px auto 0',
              }} />
            )}
          </div>
        ))}

        {/* Footer note */}
        <div style={{
          textAlign: 'center',
          paddingTop: '40px',
          borderTop: '1px solid #eee',
          fontFamily: '"Songti SC", "STSong", Georgia, "Noto Serif SC", serif',
        }}>
          <p style={{ fontSize: '12px', color: '#bbb', letterSpacing: '2px' }}>
            墨记 Moji
          </p>
        </div>
      </div>
    </>
  )
}
