import { useEffect, useState } from 'react'

// Эхний утга — index.html-ийн script <html data-theme>-ийг аль хэдийн тавьсан байгаа
function initialTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

// theme: 'light' | 'dark', toggle() — солих
export function useTheme() {
  const [theme, setTheme] = useState(initialTheme)

  // theme солигдоход <html data-theme="..."> болгож, дараа нээхэд санахаар хадгална
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // Нууц цонх (private mode) зэрэгт хадгалж чадахгүй — зүгээр, зөвхөн санахгүй
    }
  }, [theme])

  function toggle() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggle }
}
