import { Link, useOutletContext } from 'react-router-dom'
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined'
import CameraThumb from '../../components/resident/CameraThumb'
import ProgressBar from '../../components/UI/ProgressBar'
// Backend-тэй түр холбоогүй — бүх өгөгдөл жишээ файлаас
import {
  sampleBill, sampleCameras, sampleEntrance, sampleMeeting, sampleMyRequest, sampleNews, totalCameras,
} from '../../samples/resident/home'
import './styles/Home.css'

const weekdays = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба']

// Шөнийн тэнгэрийн одод — байрлал (px) нь тогтмол, анивчих хугацаа нь ялгаатай
const stars = [
  [24, 300], [60, 250], [380, 30], [440, 70], [520, 110], [600, 40], [660, 150], [720, 90],
  [300, 20], [480, 200], [560, 260], [640, 300], [400, 160], [350, 280], [700, 230], [20, 220],
]

const requestSteps = 4 // ирсэн → томилсон → хийгдэж буй → шийдсэн

// 85000 → '85,000₮'
function money(n) {
  return `${n.toLocaleString('en-US')}₮`
}

export default function Home() {
  const { user } = useOutletContext()

  const today = new Date()
  const dateText = `${weekdays[today.getDay()]}, ${today.getMonth() + 1}-р сарын ${today.getDate()}`

  // Орцны цонхнууд — төлбөрөө төлсөн айл гэрэлтэй, төлөөгүй нь харанхуй
  const { units, unpaidWindows, myWindow } = sampleEntrance
  const paidCount = units - unpaidWindows.length
  const paidPercent = Math.round((paidCount / units) * 100)
  const myDark = unpaidWindows.includes(myWindow)
  const windows = Array.from({ length: units }, (_, i) => ({
    id: i,
    lit: !unpaidWindows.includes(i),
    mine: i === myWindow,
  }))

  return (
    <div className="res-home">
      <div className="home-top">
        {/* Таны орц — шөнийн байрны зураг */}
        <section className="home-hero" aria-label="Таны орц">
          {stars.map(([x, y], i) => (
            <span
              key={i}
              className="home-star"
              aria-hidden="true"
              style={{ left: x, top: y, animationDelay: `${((i * 0.41) % 3).toFixed(2)}s` }}
            />
          ))}
          <span className="home-moon" aria-hidden="true" />

          <div className="home-greet">
            <span className="home-date">{dateText}</span>
            <h1>Сайн байна уу, {user.name}</h1>
            <span className="home-greet-text">
              {sampleEntrance.name}ны {units} айлын {paidCount} нь төлбөрөө төлж гэрлээ асаасан.
              {myDark ? ' Таны цонх л харанхуй байна.' : ' Таны цонх ч гэрэлтэй байна!'}
            </span>
          </div>

          <div
            className="home-building"
            role="img"
            aria-label={`${sampleEntrance.name}ны зураг: ${units} айлын ${paidCount} нь төлбөрөө төлж гэрэлтэй, таны цонх ${myDark ? 'харанхуй' : 'гэрэлтэй'}`}
          >
            <div className="home-roof" />
            <div className="home-windows">
              {windows.map((w) => (
                <span key={w.id} className={`home-window${w.lit ? ' lit' : ''}${w.mine ? ' mine' : ''}`}>
                  {w.mine && <span className="home-window-tag">Таны цонх</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="home-ground" aria-hidden="true" />
        </section>

        {/* Энэ сарын төлбөр */}
        <section className="home-bill" aria-labelledby="bill-title">
          <div className="home-bill-head">
            <h2 id="bill-title">{sampleBill.month}-р сарын төлбөр</h2>
            <span className="home-due">{sampleBill.due} хүртэл</span>
          </div>
          <span className="home-amount">{money(sampleBill.amount)}</span>
          <div className="home-bill-progress">
            <ProgressBar value={paidPercent} color="var(--yellow)" />
            <span className="home-muted">Орцны {paidPercent}% нь төлж гэрлээ асаасан</span>
          </div>
          <div className="home-spacer" />
          <Link to="/pay" className="home-pay">
            <LightbulbOutlined sx={{ fontSize: 22 }} /> Төлбөр төлж гэрлээ асаах
          </Link>
          <Link to="/pay" className="home-history">Төлбөрийн түүх харах</Link>
        </section>
      </div>

      <div className="home-cards">
        {/* Хурал */}
        <Link to="/meeting" className="home-meeting">
          <span className="home-meeting-head">
            <span className="home-meeting-date">
              <span className="home-meeting-month">{sampleMeeting.month}-р сар</span>
              <span className="home-meeting-day">{sampleMeeting.day}</span>
            </span>
            <span className="home-meeting-info">
              <span className="home-meeting-when">{sampleMeeting.when}</span>
              <span className="home-meeting-title">{sampleMeeting.title}</span>
            </span>
          </span>
          <span className="home-meeting-text">{sampleMeeting.text}</span>
          <span className="home-meeting-go">Хуралд бэлдэх →</span>
        </Link>

        {/* Сүүлийн зарлал */}
        <section className="home-card" aria-labelledby="news-title">
          <div className="home-card-head">
            <h2 id="news-title">Сүүлийн зарлал</h2>
            <Link to="/news" className="home-card-link">Бүгд</Link>
          </div>
          {sampleNews.map((n) => (
            <Link key={n.id} to="/news" className="home-news">
              <span className={n.important ? 'home-news-tag important' : 'home-news-tag'}>{n.tag}</span>
              <span className="home-news-title">{n.title}</span>
            </Link>
          ))}
        </section>

        {/* Миний хүсэлт */}
        <section className="home-card" aria-labelledby="req-title">
          <div className="home-card-head">
            <h2 id="req-title">Миний хүсэлт</h2>
            <Link to="/requests" className="home-card-link">+ Шинэ</Link>
          </div>
          <div className="home-request">
            <span className="home-request-title">{sampleMyRequest.title}</span>
            {/* Явц — 4 алхам, хийгдсэн нь тод */}
            <span className="home-steps" aria-hidden="true">
              {Array.from({ length: requestSteps }, (_, i) => (
                <span key={i} className={i <= sampleMyRequest.step ? 'home-step done' : 'home-step'} />
              ))}
            </span>
            <span className="home-muted small">{sampleMyRequest.status}</span>
          </div>
          <span className="home-muted small">Өөр {sampleMyRequest.doneCount} хүсэлт шийдэгдсэн</span>
        </section>
      </div>

      {/* Камер */}
      <section className="home-cams" aria-labelledby="cam-title">
        <div className="home-card-head">
          <h2 id="cam-title">Камер</h2>
          <Link to="/cameras" className="home-card-link">Бүгдийг харах ({totalCameras})</Link>
        </div>
        <div className="home-cams-grid">
          {sampleCameras.map((c) => <CameraThumb key={c.id} camera={c} />)}
        </div>
      </section>
    </div>
  )
}
