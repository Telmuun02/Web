import { useEffect, useState } from 'react'
import './LiveBar.css'

const eventEvery = 6 // сек — сүүлийн үйл явдал хэдэн секунд тутам солигдох

// Ажилтны хуудсуудын дээд талын "ШУУД" мөр — цаг, 3 үзүүлэлт, сүүлийн үйл явдал.
// stats:  [{ label: 'Өнөөдөр орсон', value: '1,275,000₮', tone: 'yellow' | 'green' }]
// events: ['QPay: 2-22 тоот 85,000₮ төлөв', ...]
// Түр — backend-гүй тул events-ийг ээлжлэн харуулна. Дараа нь серверээс ирсэн шинэ үйл явдлаар солигдоно
export default function LiveBar({ stats, events }) {
  const [start] = useState(() => Date.now()) // хуудас нээгдсэн мөч
  const [now, setNow] = useState(start)

  // Секунд тутам цагийг шинэчилнэ
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer) // хуудаснаас гарахад зогсооно
  }, [])

  const seconds = Math.floor((now - start) / 1000)
  const index = Math.floor(seconds / eventEvery) % events.length // одоо харуулах үйл явдал
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
      <span key={index} className="live-bar-event">
        {events[index]} · {age < 2 ? 'дөнгөж сая' : `${age} сек өмнө`}
      </span>
    </section>
  )
}
