import { useEffect, useRef } from 'react'
import { subscribe } from '../api/realtime'

// Өгсөн хүснэгтүүдийн аль нэг өөрчлөгдөхөд onChange-ийг дуудна (300мс-д нэг удаа).
// WebSocket тасраад дахин холбогдоход ч дуудна — тасарсан хооронд алдагдсан өөрчлөлтийг нөхнө.
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
      const reconnected = msg.type === 'connected' && msg.reconnect
      const changed = msg.type === 'change' && msg.tables.some((t) => watched.includes(t))
      if (!reconnected && !changed) return
      clearTimeout(timer)
      timer = setTimeout(() => ref.current(), 300)
    })
    return () => {
      clearTimeout(timer)
      off()
    }
  }, [key])
}
