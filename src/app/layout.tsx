import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ServiceWorkerRegistrar } from './sw-register'

export const metadata: Metadata = {
  title: '墨记 Moji',
  description: '个人日记',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '墨记',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
