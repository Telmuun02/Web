import { useState } from 'react'
import useNow from '../../hooks/useNow'
import './LiveBar.css'

const eventEvery = 6 // сек — сүүлийн үйл явдал хэдэн секунд тутам солигдох

// Ажилтны хуудсуудын дээд талын "ШУУД" мөр — цаг, 3 үзүүлэлт, сүүлийн үйл явдал.
// stats:  [{ label: 'Өнөөдөр орсон', value: '1,275,000₮', tone: 'yellow' | 'green' }]
// events: ['QPay: 2-22 тоот 85,000₮ төлөв', ...]
// Өгөгдлийг хуудас өөрөө useLive('invoices', fallback)-аар татаад prop-оор өгнө — энэ component зөвхөн зурна
export default function LiveBar({ stats, events }) {
  const [start] = useState(() => Date.now()) // хуудас нээгдсэн мөч
  const now = useNow() // секунд тутам шинэчлэгдэнэ

  const seconds = Math.floor((now - start) / 1000)
  const index = events.length ? Math.floor(seconds / eventEvery) % events.length : 0 // одоо харуулах үйл явдал
  const age = seconds % eventEvery                                 // хэдэн секундын өмнө "болсон"

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

      {/* key солигдоход React шинээр зурна — тэгэхээр CSS-ийн гарч ирэх хөдөлгөөн дахин тоглоно */}
      {events.length > 0 && (
        <span key={index} className="live-bar-event">
          {events[index]} · {age < 2 ? 'дөнгөж сая' : `${age} сек өмнө`}
        </span>
      )}
    </section>
  )
}
