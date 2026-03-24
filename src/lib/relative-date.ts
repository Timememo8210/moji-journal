import { format, isToday, isYesterday, differenceInDays, differenceInHours } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { Locale, t, getStoredLocale } from './i18n'
import { useI18n } from '@/contexts/I18nContext'

function getLocaleConfig(locale: Locale) {
  return locale === 'zh' ? zhCN : enUS
}

export function relativeDate(dateStr: string, locale?: Locale): string {
  const l = locale || getStoredLocale()
  const date = new Date(dateStr)
  const now = new Date()
  const dateFnsLocale = getLocaleConfig(l)

  if (isToday(date)) {
    const hours = differenceInHours(now, date)
    if (hours < 1) return t('justNow', l)
    return `${t('today', l)} ${format(date, 'HH:mm')}`
  }

  if (isYesterday(date)) {
    return `${t('yesterday', l)} ${format(date, 'HH:mm')}`
  }

  const days = differenceInDays(now, date)
  if (days <= 7) {
    if (l === 'zh') return `${days}天前`
    return `${days} days ago`
  }

  if (date.getFullYear() === now.getFullYear()) {
    if (l === 'zh') return format(date, 'M月d日', { locale: dateFnsLocale })
    return format(date, 'MMM d', { locale: dateFnsLocale })
  }

  if (l === 'zh') return format(date, 'yyyy年M月d日', { locale: dateFnsLocale })
  return format(date, 'MMM d, yyyy', { locale: dateFnsLocale })
}

export function relativeCardDate(dateStr: string, locale?: Locale): string {
  const l = locale || getStoredLocale()
  const date = new Date(dateStr)
  const now = new Date()
  const dateFnsLocale = getLocaleConfig(l)

  if (isToday(date)) return t('today', l)
  if (isYesterday(date)) return t('yesterday', l)

  const days = differenceInDays(now, date)
  if (days <= 7) {
    if (l === 'zh') return `${days}天前`
    return `${days} days ago`
  }

  if (date.getFullYear() === now.getFullYear()) {
    if (l === 'zh') return format(date, 'M月d日 EEEE', { locale: dateFnsLocale })
    return format(date, 'MMM d, EEEE', { locale: dateFnsLocale })
  }

  if (l === 'zh') return format(date, 'yyyy年M月d日 EEEE', { locale: dateFnsLocale })
  return format(date, 'MMM d, yyyy EEEE', { locale: dateFnsLocale })
}

// Hook versions for components
export function useRelativeDate(dateStr: string): string {
  const { locale } = useI18n()
  return relativeDate(dateStr, locale)
}

export function useRelativeCardDate(dateStr: string): string {
  const { locale } = useI18n()
  return relativeCardDate(dateStr, locale)
}
