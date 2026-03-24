import { mockEntries } from './mock-data'

const GUEST_MODE_KEY = 'moji-guest-mode'
const GUEST_ENTRIES_KEY = 'moji-entries'

export function isGuestMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(GUEST_MODE_KEY) === 'true'
}

export function enterGuestMode() {
  localStorage.setItem(GUEST_MODE_KEY, 'true')
  // Seed with mock entries if no local entries exist
  if (!localStorage.getItem(GUEST_ENTRIES_KEY)) {
    localStorage.setItem(GUEST_ENTRIES_KEY, JSON.stringify(mockEntries))
  }
}

export function exitGuestMode() {
  localStorage.removeItem(GUEST_MODE_KEY)
}

export function getGuestEntries(): string | null {
  return localStorage.getItem(GUEST_ENTRIES_KEY)
}

export function clearGuestEntries() {
  localStorage.removeItem(GUEST_ENTRIES_KEY)
}
