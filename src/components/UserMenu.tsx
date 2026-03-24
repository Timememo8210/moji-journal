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
        className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
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
        className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center 
                   justify-center text-zinc-300 text-xs font-medium hover:border-zinc-500 
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
              className="absolute right-0 top-10 z-20 bg-zinc-900 border border-zinc-800 
                         rounded-xl shadow-xl py-1.5 min-w-[160px]"
            >
              <div className="px-4 py-2 border-b border-zinc-800 mb-1">
                <p className="text-white text-sm font-medium truncate">{displayName}</p>
                <p className="text-zinc-500 text-xs truncate">{user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:text-white 
                           hover:bg-zinc-800 transition-colors"
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
