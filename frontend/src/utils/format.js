// Backend-ээс ирсэн тоо, огноог дэлгэцэнд харуулах жижиг функцүүд (оршин суугчийн хуудсууд)

// 85000 → '85,000₮'
export function money(n) {
  return `${Number(n || 0).toLocaleString('en-US')}₮`
}

// '2026-11-25' эсвэл Date → '11/25'
export function monthDay(value) {
  const d = new Date(value)
  return `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, '0')}`
}

// '2026-11-01' → 11
export function monthOf(value) {
  return new Date(value).getMonth() + 1
}

// Огноо өнөөдөр бол 'Өнөөдөр', өчигдөр бол 'Өчигдөр', бусад үед '11/14'
export function relativeDay(value) {
  const d = new Date(value)
  const today = new Date()
  const days = Math.round((new Date(today.toDateString()) - new Date(d.toDateString())) / 86400000)
  if (days === 0) return 'Өнөөдөр'
  if (days === 1) return 'Өчигдөр'
  return monthDay(d)
}
