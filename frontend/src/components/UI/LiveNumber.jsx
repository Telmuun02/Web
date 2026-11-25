/**
 * WebSocket-оор шинэчлэгдсэн тоо — өсөхөд дээр нь "+өсөлт" тэмдэг хөвж гарч, тоо хуучнаасаа шинэ рүү зөөлөн өснө.
 *   <LiveNumber value={today.amount} format={money} />
 * value  — одоогийн тоо
 * format — тоог текст болгох (анхдагч: 1,234)
 * Эхний ачааллад хөдөлгөөнгүй. Буурвал шууд солигдоно.
 */

import { useEffect, useState } from 'react'
import './LiveNumber.css'

const DURATION_MS = 1200

const plain = (n) => n.toLocaleString('en-US')
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function LiveNumber({ value, format = plain }) {
  const [shown, setShown] = useState(value)
  const [change, setChange] = useState({ value, from: value, delta: 0, key: 0 })

  if (change.value !== value) {
    setChange({ value, from: shown, delta: value - change.value, key: change.key + 1 })
  }

  useEffect(() => {
    if (!change.key) return
    const { from, value: to } = change
    const start = performance.now()
    let frame

    function step(now) {
      const p = to < from || reducedMotion() ? 1 : Math.min(1, (now - start) / DURATION_MS)
      const eased = 1 - (1 - p) ** 3
      setShown(Math.round(from + (to - from) * eased))
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [change])

  return (
    <span className="live-number">
      {format(shown)}
      {change.delta > 0 && (
        <span key={change.key} className="live-number-delta" aria-live="polite">
          +{format(change.delta)}
        </span>
      )}
    </span>
  )
}
