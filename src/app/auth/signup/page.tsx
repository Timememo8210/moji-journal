'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { signUp } from '@/lib/auth'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 6) {
      setError('密码至少需要6位')
      setLoading(false)
      return
    }

    const { data, error } = await signUp(email, password, displayName)
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data?.user?.identities?.length === 0) {
      setError('该邮箱已注册，请直接登录')
      setLoading(false)
    } else {
      // Check if email confirmation is needed
      if (data?.session) {
        // Auto-logged in (email confirmation disabled)
        router.push('/')
        router.refresh()
      } else {
        setSuccess(true)
        setLoading(false)
      }
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="text-5xl mb-6">✉️</div>
          <h2 className="text-white text-xl font-light mb-3">验证邮件已发送</h2>
          <p className="text-zinc-500 text-sm leading-relaxed mb-6">
            请查收 <span className="text-zinc-300">{email}</span> 的验证邮件，
            点击链接完成注册后即可登录。
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-white text-black text-sm font-medium rounded-lg px-6 py-3 
                       hover:bg-zinc-100 transition-colors"
          >
            去登录
          </Link>
        </motion.div>
      </div>
    )
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
          <p className="text-zinc-500 text-sm tracking-widest">创建账号</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="昵称（可选）"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 
                         rounded-lg px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 
                         transition-colors"
            />
          </div>
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
              placeholder="密码（至少6位）"
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
            {loading ? '注册中...' : '创建账号'}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-zinc-500 text-sm mt-6">
          已有账号？{' '}
          <Link href="/auth/login" className="text-zinc-300 hover:text-white transition-colors">
            登录
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
