import { useCallback, useEffect, useState } from 'react'

/**
 * Light or dark look. Dark (candlelit night) is the default; light mode is a
 * per-device choice from the ☰ menu, remembered in localStorage like read aloud.
 * The choice is applied as <html data-theme="light">, which index.css styles.
 */
export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'wth.theme'

export function loadTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* private mode or blocked storage: the switch still works for this page load */
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(loadTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'light' ? 'dark' : 'light'
      storeTheme(next)
      return next
    })
  }, [])

  return { theme, toggle }
}
