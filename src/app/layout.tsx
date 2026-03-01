import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '墨记 Moji',
  description: '个人日记',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">{children}</body>
    </html>
  )
}
