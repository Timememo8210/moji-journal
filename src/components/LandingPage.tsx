'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useI18n } from '@/contexts/I18nContext'
import { enterGuestMode } from '@/lib/guest'

export default function LandingPage() {
  const router = useRouter()
  const { t } = useI18n()

  const handleGuest = () => {
    enterGuestMode()
    router.refresh()
    // Force a re-render by navigating to same page
    window.location.reload()
  }

  const features = [
    { icon: '✍️', title: t('landingFeature1'), desc: t('landingFeature1Desc') },
    { icon: '🎨', title: t('landingFeature2'), desc: t('landingFeature2Desc') },
    { icon: '☁️', title: t('landingFeature3'), desc: t('landingFeature3Desc') },
  ]

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center max-w-md w-full"
        >
          <h1 className="text-5xl sm:text-6xl font-light tracking-[0.2em] mb-3">
            {t('appName')}
          </h1>
          <p className="text-zinc-500 text-xs tracking-[0.4em] uppercase mb-6">
            {t('appSubtitle')}
          </p>
          <p className="text-zinc-400 text-lg font-light mb-16">
            {t('landingTagline')}
          </p>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-3 gap-6 mb-16"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl mb-3">{f.icon}</div>
                <div className="text-sm font-medium text-zinc-200 mb-1">{f.title}</div>
                <div className="text-xs text-zinc-500 leading-relaxed">{f.desc}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <div className="flex gap-3">
              <button
                onClick={handleGuest}
                className="flex-1 border border-zinc-700 text-zinc-300 rounded-lg py-3.5 text-sm
                           hover:border-zinc-500 hover:text-white transition-colors tracking-wide"
              >
                {t('tryAsGuest')}
              </button>
              <button
                onClick={() => router.push('/auth/signup')}
                className="flex-1 bg-white text-black font-medium rounded-lg py-3.5 text-sm
                           hover:bg-zinc-100 transition-colors tracking-wide"
              >
                {t('createAccountCta')}
              </button>
            </div>

            <button
              onClick={() => router.push('/auth/login')}
              className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
            >
              {t('haveAccountLogin')}
            </button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
