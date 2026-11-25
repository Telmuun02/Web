/**
 * Ажилтны хуудсуудын дээд талын "ШУУД" мөр — цаг, 3 үзүүлэлт, сүүлийн үйл явдал (6 сек тутам солигдоно).
 * stats:  [{ label: 'Өнөөдөр орсон', value: '1,275,000₮', tone: 'yellow' | 'green' }]
 * events: ['QPay: 2-22 тоот 85,000₮ төлөв', ...]
 * Өгөгдлийг хуудас өөрөө useLive(...)-аар татаад prop-оор өгнө — энэ component зөвхөн зурна
 */

import { useState } from 'react'
import useNow from '../../hooks/useNow'
import './LiveBar.css'

const eventEvery = 6

export default function LiveBar({ stats, events }) {
  const [start] = useState(() => Date.now())
  const now = useNow()

  const seconds = Math.floor((now - start) / 1000)
  const index = events.length ? Math.floor(seconds / eventEvery) % events.length : 0
  const age = seconds % eventEvery

  return (
    <section className="live-bar" aria-label="Шууд мэдээлэл">
      <span className="live-bar-clock">
        <span className="live-bar-dot" aria-hidden="true" />
        ШУУД · {new Date(now).toLocaleTimeString('en-GB')}
      </span>

      {stats.map((s) => (
        <span key={s.label} className="live-bar-stat">
          <span className="live-bar-label">{s.label}</span>
          <span className={s.tone ? `live-bar-value ${s.tone}` : 'live-bar-value'}>{s.value}</span>
        </span>
      ))}

      {events.length > 0 && (
        <span key={index} className="live-bar-event">
          {events[index]} · {age < 2 ? 'дөнгөж сая' : `${age} сек өмнө`}
        </span>
      )}
    </section>
  )
}
