'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { useTheme, Theme } from '@/contexts/ThemeContext'
import { useToast } from '@/components/Toast'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { signOut } from '@/lib/auth'
import { getEntries, exportEntries } from '@/lib/entries'
import { format } from 'date-fns'
import { Locale } from '@/lib/i18n'

export default function SettingsPage() {
  const router = useRouter()
  const { user, isConfigured } = useAuth()
  const { locale, setLocale, t } = useI18n()
  const { theme, setTheme } = useTheme()
  const { showToast } = useToast()

  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(user?.user_metadata?.display_name || '')
  const [savingName, setSavingName] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || t('user')

  const handleUpdateName = async () => {
    if (!newName.trim()) return
    setSavingName(true)
    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase.auth.updateUser({
        data: { display_name: newName.trim() },
      })
      if (error) throw error
      showToast(t('displayNameUpdated'))
      setEditingName(false)
    } catch {
      showToast(t('displayNameFailed'), 'error')
    } finally {
      setSavingName(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      showToast(t('passwordTooShort'), 'error')
      return
    }
    if (newPassword !== confirmPwd) {
      showToast(t('passwordMismatch'), 'error')
      return
    }
    setSavingPassword(true)
    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      showToast(t('passwordChanged'))
      setShowPasswordForm(false)
      setNewPassword('')
      setConfirmPwd('')
    } catch {
      showToast(t('passwordChangeFailed'), 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const handleExport = async () => {
    try {
      const entries = await getEntries()
      const json = exportEntries(entries)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `moji-export-${format(new Date(), 'yyyy-MM-dd')}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast(t('exportSuccess'))
    } catch {
      showToast(t('loadFailed'), 'error')
    }
  }

  const handleClearCache = () => {
    if (!confirm(t('clearCacheConfirm'))) return
    const keysToKeep = ['moji-lang', 'moji-theme']
    const saved: Record<string, string> = {}
    keysToKeep.forEach((k) => {
      const v = localStorage.getItem(k)
      if (v) saved[k] = v
    })
    localStorage.clear()
    Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v))
    showToast(t('cacheCleared'))
  }

  const themeOptions: { value: Theme; label: string }[] = [
    { value: 'light', label: t('themeLight') },
    { value: 'dark', label: t('themeDark') },
    { value: 'system', label: t('themeSystem') },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-bottom"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-journal mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1 min-h-[44px] pr-3"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t('back')}
          </button>
          <h1 className="text-lg font-semibold dark:text-white">{t('settings')}</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-journal mx-auto px-6 py-8 space-y-8">
        {/* Account Info */}
        <Section title={t('accountInfo')}>
          {isConfigured && user ? (
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-xs text-gray-400 dark:text-gray-500 block mb-1">{t('emailPlaceholder')}</label>
                <p className="text-sm text-gray-900 dark:text-gray-100">{user.email}</p>
              </div>

              {/* Display name */}
              <div>
                <label className="text-xs text-gray-400 dark:text-gray-500 block mb-1">{t('displayName')}</label>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:border-gray-400"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateName}
                      disabled={savingName}
                      className="px-3 py-2 text-sm text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-30"
                    >
                      {t('save')}
                    </button>
                    <button
                      onClick={() => setEditingName(false)}
                      className="px-3 py-2 text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{displayName}</p>
                    <button
                      onClick={() => { setNewName(displayName); setEditingName(true) }}
                      className="text-xs text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {t('editDisplayName')}
                    </button>
                  </div>
                )}
              </div>

              {/* Change password */}
              <div>
                {showPasswordForm ? (
                  <div className="space-y-3">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('newPassword')}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:border-gray-400"
                    />
                    <input
                      type="password"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      placeholder={t('confirmPassword')}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:border-gray-400"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleChangePassword}
                        disabled={savingPassword}
                        className="px-4 py-2 text-sm text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-30"
                      >
                        {t('update')}
                      </button>
                      <button
                        onClick={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPwd('') }}
                        className="px-3 py-2 text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  >
                    {t('changePassword')}
                  </button>
                )}
              </div>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="w-full text-left text-sm text-red-500 hover:text-red-600 transition-colors py-2"
              >
                {t('signOut')}
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">{t('notLoggedIn')}</p>
              <button
                onClick={() => router.push('/auth/login')}
                className="text-sm text-gray-900 dark:text-white underline underline-offset-4"
              >
                {t('loginToManage')}
              </button>
            </div>
          )}
        </Section>

        {/* Language */}
        <Section title={t('language')}>
          <div className="flex gap-3">
            {(['zh', 'en'] as Locale[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  locale === lang
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                {lang === 'zh' ? '中文' : 'English'}
              </button>
            ))}
          </div>
        </Section>

        {/* Theme */}
        <Section title={t('theme')}>
          <div className="flex gap-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  theme === opt.value
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Data */}
        <Section title={t('data')}>
          <div className="space-y-3">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('exportData')}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('exportDataDesc')}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0">
                <path d="M8 2v8M4 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={handleClearCache}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('clearCache')}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('clearCacheDesc')}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0">
                <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </Section>
      </main>
    </motion.div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{title}</h2>
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
        {children}
      </div>
    </section>
  )
}
