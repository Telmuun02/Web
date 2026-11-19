import { Link, useOutletContext } from 'react-router-dom'
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined'
import CameraThumb from '../../components/resident/CameraThumb'
import ProgressBar from '../../components/UI/ProgressBar'
import useApi from '../../hooks/useApi'
import { money, monthDay, monthOf, relativeDay } from '../../utils/format'
// Камерын систем холбогдоогүй тул түр жишээ файлаас (бусад нь GET /api/resident/home)
import { sampleCameras, totalCameras } from '../../samples/resident/home'
import './styles/Home.css'

const weekdays = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба']

// Шөнийн тэнгэрийн одод — байрлал (px) нь тогтмол, анивчих хугацаа нь ялгаатай
const stars = [
  [24, 300], [60, 250], [380, 30], [440, 70], [520, 110], [600, 40], [660, 150], [720, 90],
  [300, 20], [480, 200], [560, 260], [640, 300], [400, 160], [350, 280], [700, 230], [20, 220],
]

// Хүсэлтийн явц — backend-ийн stage → хэд дэх алхам (ирсэн → томилсон → хийгдэж буй → шийдсэн)
const stageStep = { new: 0, assigned: 1, progress: 2, done: 3 }
const requestSteps = 4

// Хүсэлтийн доорх тайлбар мөр
function requestNote(r) {
  if (r.stage === 'new') return 'СӨХ хүлээн авахыг хүлээж байна'
  if (r.stage === 'assigned') return `${r.assigned_name ?? 'Ажилтан'} хариуцлаа`
  if (r.stage === 'progress') return `Хийгдэж байна${r.assigned_name ? ` · ${r.assigned_name}` : ''}`
  return r.status === 'rejected' ? 'Татгалзсан' : 'Шийдэгдсэн'
}

export default function Home() {
  const { user } = useOutletContext()
  const { data, error } = useApi('/resident/home', null, { fallback: null })

  const today = new Date()
  const dateText = `${weekdays[today.getDay()]}, ${today.getMonth() + 1}-р сарын ${today.getDate()}`

  if (error) return <div className="res-home"><p role="alert">{error}</p></div>
  if (!data) return <div className="res-home"><p>Ачааллаж байна…</p></div>

  const { unit, entrance, bill, news, request, meeting } = data
  const meetingAt = meeting ? new Date(meeting.starts_at) : null

  // Орцны цонхнууд — энэ сарын төлбөрөө бүрэн төлсөн айл гэрэлтэй, төлөөгүй нь харанхуй
  const windows = entrance.units
  const units = windows.length
  const paidCount = windows.filter((w) => w.paid).length
  const paidPercent = units ? Math.round((paidCount / units) * 100) : 0
  const myDark = !windows.find((w) => w.id === unit.id)?.paid
  // Нэг давхарт хэдэн айл байгаагаар баганын тоог тааруулна
  const perFloor = Math.max(1, ...Object.values(Object.groupBy(windows, (w) => w.floor ?? 0)).map((f) => f.length))
  const entranceName = `${unit.entrance}-р орц`

  const latest = request.latest
  const otherDone = request.done_count - (latest?.stage === 'done' ? 1 : 0)
  const left = bill ? bill.amount - bill.paid : 0

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
              {entranceName}ны {units} айлын {paidCount} нь төлбөрөө төлж гэрлээ асаасан.
              {myDark ? ' Таны цонх л харанхуй байна.' : ' Таны цонх ч гэрэлтэй байна!'}
            </span>
          </div>

          <div
            className="home-building"
            role="img"
            aria-label={`${entranceName}ны зураг: ${units} айлын ${paidCount} нь төлбөрөө төлж гэрэлтэй, таны цонх ${myDark ? 'харанхуй' : 'гэрэлтэй'}`}
          >
            <div className="home-roof" />
            <div className="home-windows" style={{ gridTemplateColumns: `repeat(${perFloor}, minmax(0, 1fr))` }}>
              {windows.map((w) => (
                <span key={w.id} className={`home-window${w.paid ? ' lit' : ''}${w.id === unit.id ? ' mine' : ''}`}>
                  {w.id === unit.id && <span className="home-window-tag">Таны цонх</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="home-ground" aria-hidden="true" />
        </section>

        {/* Энэ сарын төлбөр */}
        <section className="home-bill" aria-labelledby="bill-title">
          {bill ? (
            <>
              <div className="home-bill-head">
                <h2 id="bill-title">{monthOf(bill.period)}-р сарын төлбөр</h2>
                <span className="home-due">{monthDay(bill.due_date)} хүртэл</span>
              </div>
              <span className="home-amount">{money(left > 0 ? left : bill.amount)}</span>
              {left <= 0 && <span className="home-muted">Бүрэн төлөгдсөн</span>}
            </>
          ) : (
            <h2 id="bill-title">Энэ сарын нэхэмжлэл хараахан гараагүй байна</h2>
          )}
          <div className="home-bill-progress">
            <ProgressBar value={paidPercent} color="var(--yellow)" />
            <span className="home-muted">Орцны {paidPercent}% нь төлж гэрлээ асаасан</span>
          </div>
          <div className="home-spacer" />
          {left > 0 && (
            <Link to="/pay" className="home-pay">
              <LightbulbOutlined sx={{ fontSize: 22 }} /> Төлбөр төлж гэрлээ асаах
            </Link>
          )}
          <Link to="/pay" className="home-history">Төлбөрийн түүх харах</Link>
        </section>
      </div>

      <div className="home-cards">
        {/* Удахгүй болох хурал — meetings хүснэгтээс */}
        <Link to="/meeting" className="home-meeting">
          {meeting ? (
            <>
              <span className="home-meeting-head">
                <span className="home-meeting-date">
                  <span className="home-meeting-month">{meetingAt.getMonth() + 1}-р сар</span>
                  <span className="home-meeting-day">{meetingAt.getDate()}</span>
                </span>
                <span className="home-meeting-info">
                  <span className="home-meeting-when">
                    {meeting.location} · {weekdays[meetingAt.getDay()]} {meetingAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="home-meeting-title">{meeting.title}</span>
                </span>
              </span>
              {meeting.description && <span className="home-meeting-text">{meeting.description}</span>}
              <span className="home-meeting-go">Хуралд бэлдэх →</span>
            </>
          ) : (
            <span className="home-meeting-text">Удахгүй болох хурал алга</span>
          )}
        </Link>

        {/* Сүүлийн зарлал */}
        <section className="home-card" aria-labelledby="news-title">
          <div className="home-card-head">
            <h2 id="news-title">Сүүлийн зарлал</h2>
            <Link to="/news" className="home-card-link">Бүгд</Link>
          </div>
          {news.length === 0 && <span className="home-muted small">Зарлал алга</span>}
          {news.map((n) => (
            <Link key={n.id} to="/news" className="home-news">
              <span className={n.important ? 'home-news-tag important' : 'home-news-tag'}>
                {n.important ? 'Чухал' : 'Мэдээлэл'} · {relativeDay(n.created_at)}
              </span>
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
          {latest ? (
            <div className="home-request">
              <span className="home-request-title">{latest.title}</span>
              {/* Явц — 4 алхам, хийгдсэн нь тод */}
              <span className="home-steps" aria-hidden="true">
                {Array.from({ length: requestSteps }, (_, i) => (
                  <span key={i} className={i <= stageStep[latest.stage] ? 'home-step done' : 'home-step'} />
                ))}
              </span>
              <span className="home-muted small">{requestNote(latest)}</span>
            </div>
          ) : (
            <span className="home-muted small">Та одоогоор хүсэлт илгээгээгүй байна</span>
          )}
          {otherDone > 0 && <span className="home-muted small">Өөр {otherDone} хүсэлт шийдэгдсэн</span>}
        </section>
      </div>

      {/* Камер — камерын систем холбогдоогүй, түр жишээ */}
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
