'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from '@/lib/auth'
import Link from 'next/link'

export default function UserMenu() {
  const { user, isConfigured } = useAuth()
  const [open, setOpen] = useState(false)
  const router = useRouter()

  if (!isConfigured) return null

  const handleSignOut = async () => {
    await signOut()
    setOpen(false)
    router.push('/auth/login')
    router.refresh()
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '用户'
  const initials = displayName.charAt(0).toUpperCase()

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="flex items-center gap-1.5 text-gray-400 hover:text-gray-900 transition-colors text-sm min-h-[44px] min-w-[44px] justify-center"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
        </svg>
        登录
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center
                   justify-center text-gray-600 text-xs font-medium hover:border-gray-400
                   transition-colors"
      >
        {initials}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-11 z-20 bg-white border border-gray-200
                         rounded-xl shadow-xl py-1.5 min-w-[180px]"
            >
              <div className="px-4 py-2 border-b border-gray-100 mb-1">
                <p className="text-gray-900 text-sm font-medium truncate">{displayName}</p>
                <p className="text-gray-400 text-xs truncate">{user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-500 hover:text-gray-900
                           hover:bg-gray-50 transition-colors min-h-[44px] flex items-center"
              >
                退出登录
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
