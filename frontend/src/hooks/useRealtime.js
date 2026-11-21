import { useEffect, useRef } from 'react'
import { subscribe } from '../api/realtime'

// Realtime мессеж хүлээн авах — api/realtime.js-ийн нэг холболтод бүртгүүлнэ.
//   useRealtime((msg) => { if (msg.type === 'notify') ... })
// Хуудас гарахад өөрөө бүртгэлээ цуцална. handler-ийг ref-д хадгалдаг тул
// render бүрт шинэ функц өгсөн ч дахин бүртгүүлэхгүй.
export default function useRealtime(handler) {
  const ref = useRef(handler)
  useEffect(() => {
    ref.current = handler
  })

  useEffect(() => subscribe((msg) => ref.current(msg)), [])
}

// Өгсөн хүснэгтүүдийн аль нэг өөрчлөгдөхөд onChange-ийг дуудна (300мс-д нэг удаа).
//   useTableChange(['requests'], reload)
// tables хоосон / null бол юу ч хийхгүй (холболт ч нээхгүй).
export function useTableChange(tables, onChange) {
  const ref = useRef(onChange)
  useEffect(() => {
    ref.current = onChange
  })
  const key = (tables || []).join(',')

  useEffect(() => {
    if (!key) return
    const watched = key.split(',')
    let timer = null

    const off = subscribe((msg) => {
      if (msg.type !== 'change' || !msg.tables.some((t) => watched.includes(t))) return
      clearTimeout(timer)
      timer = setTimeout(() => ref.current(), 300)
    })
    return () => {
      clearTimeout(timer)
      off()
    }
  }, [key])
}
