import { format, isToday, isYesterday, differenceInDays, differenceInHours } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function relativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()

  if (isToday(date)) {
    const hours = differenceInHours(now, date)
    if (hours < 1) return '刚刚'
    return `今天 ${format(date, 'HH:mm')}`
  }

  if (isYesterday(date)) {
    return `昨天 ${format(date, 'HH:mm')}`
  }

  const days = differenceInDays(now, date)
  if (days <= 7) {
    return `${days}天前`
  }

  if (date.getFullYear() === now.getFullYear()) {
    return format(date, 'M月d日', { locale: zhCN })
  }

  return format(date, 'yyyy年M月d日', { locale: zhCN })
}

export function relativeCardDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()

  if (isToday(date)) return '今天'
  if (isYesterday(date)) return '昨天'

  const days = differenceInDays(now, date)
  if (days <= 7) return `${days}天前`

  if (date.getFullYear() === now.getFullYear()) {
    return format(date, 'M月d日 EEEE', { locale: zhCN })
  }

  return format(date, 'yyyy年M月d日 EEEE', { locale: zhCN })
}
