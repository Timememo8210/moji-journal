'use client'

import Link from 'next/link'
import { useI18n } from '@/contexts/I18nContext'
import { isGuestMode } from '@/lib/guest'

export default function GuestBanner() {
  const { t } = useI18n()

  if (!isGuestMode()) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50">
      <div className="max-w-journal mx-auto px-6 py-2 flex items-center justify-center gap-2 text-xs text-amber-700 dark:text-amber-400">
        <span>{t('guestBanner')}</span>
        <span className="text-amber-400 dark:text-amber-600">·</span>
        <Link
          href="/auth/signup"
          className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
        >
          {t('guestBannerCta')}
        </Link>
      </div>
    </div>
  )
}
