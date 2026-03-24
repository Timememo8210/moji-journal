'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

export type FontChoice = 'default' | 'songti' | 'kaiti'

interface FontContextType {
  font: FontChoice
  setFont: (font: FontChoice) => void
  fontStyle: React.CSSProperties
}

const fontFamilyMap: Record<FontChoice, string> = {
  default: '',
  songti: '"Songti SC", "SimSun", "Noto Serif SC", STSong, serif',
  kaiti: '"Kaiti SC", "KaiTi", "Ma Shan Zheng", STKaiti, cursive',
}

const FontContext = createContext<FontContextType>({
  font: 'default',
  setFont: () => {},
  fontStyle: {},
})

function getStoredFont(): FontChoice {
  if (typeof window === 'undefined') return 'default'
  return (localStorage.getItem('moji-font') as FontChoice) || 'default'
}

export function FontProvider({ children }: { children: ReactNode }) {
  const [font, setFontState] = useState<FontChoice>('default')

  const applyFont = useCallback((f: FontChoice) => {
    if (f === 'default') {
      document.body.style.fontFamily = ''
    } else {
      document.body.style.fontFamily = fontFamilyMap[f]
    }
  }, [])

  useEffect(() => {
    const stored = getStoredFont()
    setFontState(stored)
    applyFont(stored)

    // Load Google Fonts for fallback if needed
    if (stored !== 'default') {
      loadGoogleFonts(stored)
    }
  }, [applyFont])

  const setFont = useCallback((newFont: FontChoice) => {
    setFontState(newFont)
    localStorage.setItem('moji-font', newFont)
    applyFont(newFont)
    if (newFont !== 'default') {
      loadGoogleFonts(newFont)
    }
  }, [applyFont])

  const fontStyle: React.CSSProperties = font === 'default'
    ? {}
    : { fontFamily: fontFamilyMap[font] }

  return (
    <FontContext.Provider value={{ font, setFont, fontStyle }}>
      {children}
    </FontContext.Provider>
  )
}

function loadGoogleFonts(font: FontChoice) {
  const id = `moji-google-font-${font}`
  if (document.getElementById(id)) return

  const families: Record<string, string> = {
    songti: 'Noto+Serif+SC:wght@400;700',
    kaiti: 'Ma+Shan+Zheng',
  }

  const family = families[font]
  if (!family) return

  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`
  document.head.appendChild(link)
}

export function useFont() {
  return useContext(FontContext)
}
