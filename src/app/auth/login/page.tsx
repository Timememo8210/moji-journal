'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { signIn } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-light tracking-[0.3em] text-white mb-2">墨记</h1>
          <p className="text-zinc-500 text-sm tracking-widest">MOJI JOURNAL</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 
                         rounded-lg px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 
                         transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 
                         rounded-lg px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 
                         transition-colors"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-xs text-center"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-medium rounded-lg py-3.5 text-sm
                       hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       tracking-wide"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        {/* Sign up link */}
        <p className="text-center text-zinc-500 text-sm mt-6">
          还没有账号？{' '}
          <Link href="/auth/signup" className="text-zinc-300 hover:text-white transition-colors">
            注册
          </Link>
        </p>

        {/* Guest mode hint */}
        <p className="text-center mt-4">
          <Link href="/" className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors">
            以访客身份继续（本地模式）
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
