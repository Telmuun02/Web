/**
 * Цайвар / бараан горим — <html data-theme>-д тавьж, localStorage-д санана.
 * Эхний утгыг index.html-ийн script аль хэдийн тавьсан байгаа (анивчихгүй).
 *   const { theme, toggle } = useTheme()   // theme: 'light' | 'dark'
 */

import { useEffect, useState } from 'react'

function initialTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('theme', theme)
    } catch {
    }
  }, [theme])

  function toggle() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggle }
}
