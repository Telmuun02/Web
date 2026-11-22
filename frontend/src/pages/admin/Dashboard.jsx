import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import AddOutlined from '@mui/icons-material/AddOutlined'
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined'
import ElevatorOutlined from '@mui/icons-material/ElevatorOutlined'
import PauseRounded from '@mui/icons-material/PauseRounded'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import ThermostatOutlined from '@mui/icons-material/ThermostatOutlined'
import VideocamOffOutlined from '@mui/icons-material/VideocamOffOutlined'
import api from '../../api/client'
import LiveNumber from '../../components/UI/LiveNumber'
import useApi from '../../hooks/useApi'
import useNow from '../../hooks/useNow'
import { sampleAlerts } from '../../samples/admin/dashboard'
import './styles/Dashboard.css'

// Шууд самбар — canvas "Удирдлагын самбар — ажилтан (шууд)".
// GET /api/admin/dashboard: DB өөрчлөгдөхөд WebSocket-оор шууд (дахин холбогдоход ч) шинэчлэгдэнэ.
// Цаг тутам давтан татахгүй — нээлттэй орхисон самбар D1-ийн өдрийн уншилтын хязгаарыг идэхгүй.
// "Түр зогсоох" дарвал шинэчлэлт зогсоно (уншиж байхад тоо үсрэхгүй).

const LIVE_TABLES = ['payments', 'invoices', 'requests', 'polls', 'poll_votes', 'admins']

const categoryLabels = { plumbing: 'Сантехник', electrical: 'Цахилгаан', cleaning: 'Цэвэрлэгээ', elevator: 'Лифт', other: 'Бусад' }
const alertIcons = { lift: ElevatorOutlined, cam: VideocamOffOutlined, heat: ThermostatOutlined }

// 170000 → '170,000₮'
function money(n) {
  return `${Number(n || 0).toLocaleString('en-US')}₮`
}

// 10200000 → '10.2'
function million(n) {
  return (Number(n || 0) / 1000000).toFixed(1)
}

// '40 сек өмнө', '7 мин өмнө', '3 цагийн өмнө'
function timeAgo(date, now) {
  const sec = Math.max(0, Math.floor((now - new Date(date)) / 1000))
  if (sec < 5) return 'дөнгөж сая'
  if (sec < 60) return `${sec} сек өмнө`
  if (sec < 3600) return `${Math.floor(sec / 60)} мин өмнө`
  if (sec < 86400) return `${Math.floor(sec / 3600)} цагийн өмнө`
  return `${Math.floor(sec / 86400)} өдрийн өмнө`
}

// Хариугүй хүлээсэн хугацаа: '45 сек', '7 мин', '3 цаг', '2 өдөр'
function waitTime(date, now) {
  const sec = Math.max(0, Math.floor((now - new Date(date)) / 1000))
  if (sec < 60) return `${sec} сек`
  if (sec < 3600) return `${Math.floor(sec / 60)} мин`
  if (sec < 86400) return `${Math.floor(sec / 3600)} цаг`
  return `${Math.floor(sec / 86400)} өдөр`
}

export default function Dashboard() {
  const { user } = useOutletContext()
  const now = useNow()
  const [paused, setPaused] = useState(false)
  const [ackedAlerts, setAckedAlerts] = useState({}) // "Хүлээж авлаа" дарсан анхааруулга: { lift: true }
  const [reminded, setReminded] = useState({}) // SMS сануулга: { '1-05': 'sending' | 'sent' }
  const [actionError, setActionError] = useState('')

  const { data, error } = useApi('/admin/dashboard', null, {
    fallback: null,
    live: paused ? null : LIVE_TABLES,
  })

  if (error && !data) return <div className="dashboard"><p role="alert">{error}</p></div>
  if (!data) return <div className="dashboard"><p>Ачааллаж байна…</p></div>

  const { today, month, openRequests, building, payments, requests, poll, debtors } = data

  const paidPercent = month.units ? Math.round((month.paidUnits / month.units) * 100) : 0
  const totalUnits = building.reduce((sum, e) => sum + e.units.length, 0)
  const unpaidUnits = building.reduce((sum, e) => sum + e.units.filter((u) => !u.paid).length, 0)
  const unseen = requests.filter((r) => !r.seen).length
  const alerts = sampleAlerts.filter((a) => !ackedAlerts[a.id])
  const ackedCount = sampleAlerts.length - alerts.length

  const votePercent = poll?.units ? Math.round((poll.voted / poll.units) * 100) : 0
  const voteNeed = poll ? Math.max(0, Math.ceil((poll.units * poll.threshold) / 100) - poll.voted) : 0
  const daysLeft = poll ? Math.max(0, Math.ceil((new Date(poll.endsAt) - now) / 86400000)) : 0
  const clock = new Date(now).toLocaleTimeString('en-GB')

  // "Хүлээж авах" — хүсэлтийг өөр дээрээ авна (хариуцагч = би). Бусад ажилтанд шууд харагдана
  async function acknowledge(request) {
    setActionError('')
    try {
      await api.patch(`/admin/requests/${request.id}`, { assigned_to: user.id })
    } catch (err) {
      setActionError(err.message)
    }
  }

  // SMS сануулга — SMS үйлчилгээ холбогдоогүй тул одоохондоо зөвхөн дэлгэц дээр тэмдэглэнэ
  function remind(code) {
    setReminded((m) => ({ ...m, [code]: 'sending' }))
    setTimeout(() => setReminded((m) => ({ ...m, [code]: 'sent' })), 900)
  }

  return (
    <div className="dashboard">
      <div className="dash-head">
        <div className="dash-head-text">
          <span className="dash-hello">Сайн байна уу, <Link to="/admin/profile">{user.name}</Link></span>
          <h1>Шууд самбар</h1>
          <span className={paused ? 'dash-live paused' : 'dash-live'}>
            <i aria-hidden="true" />
            <span>{paused ? 'Түр зогсоосон' : `ШУУД · ${clock}`}</span>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Шинэчлэлтийг үргэлжлүүлэх' : 'Шинэчлэлтийг түр зогсоох'}
              title={paused ? 'Үргэлжлүүлэх' : 'Түр зогсоох'}
            >
              {paused ? <PlayArrowRounded sx={{ fontSize: 16 }} /> : <PauseRounded sx={{ fontSize: 16 }} />}
            </button>
          </span>
        </div>
        <Link to="/admin/announcements" className="dash-cta">
          <AddOutlined sx={{ fontSize: 18 }} /> Зарлал нийтлэх
        </Link>
      </div>

      {/* Энэ сарын төлөлт — байрны цонх бүр нэг айл, төлсөн бол шар гэрэлтэй */}
      <section className="dash-hero" aria-label="Энэ сарын төлөлт ба өнөөдрийн орлого">
        {[4, 18, 31, 63, 72, 93].map((left, i) => (
          <span key={left} className="dash-star" aria-hidden="true" style={{ left: `${left}%`, top: `${[14, 82, 10, 8, 88, 22][i]}%`, animationDelay: `${i * 0.4}s` }} />
        ))}

        <Link to="/admin/invoices" className="dash-hero-month">
          <span className="dash-hero-label">Энэ сарын төлөлт</span>
          <span className="dash-hero-big"><LiveNumber value={paidPercent} /><small>%</small></span>
          <span className="dash-hero-bar"><span style={{ width: `${paidPercent}%` }} /></span>
          <span className="dash-hero-note">
            <strong><LiveNumber value={month.paidUnits} /></strong> / {month.units} айл гэрлээ асаасан · {million(month.collected)} / {million(month.billed)} сая₮
          </span>
        </Link>

        <div
          className="dash-building"
          role="img"
          aria-label={`${building.length} орц, ${totalUnits} айл: ${totalUnits - unpaidUnits} нь төлсөн (шар), ${unpaidUnits} нь төлөөгүй (бараан)`}
        >
          <div className="dash-entrances">
            {building.map((e) => (
              <div key={e.number} className="dash-entrance">
                <div className="dash-windows">
                  {e.units.map((u) => (
                    <span key={u.code} className={u.paid ? 'lit' : ''} title={`${u.code} — ${u.paid ? 'төлсөн' : 'төлөөгүй'}`} />
                  ))}
                </div>
                <span>{e.number}-р орц</span>
              </div>
            ))}
          </div>
          <span className="dash-building-note">Шар цонх — энэ сарын төлбөрөө төлсөн айл</span>
        </div>

        <Link to="/admin/invoices" className="dash-hero-today">
          <span className="dash-hero-label">Өнөөдөр орсон</span>
          <span className="dash-hero-money"><LiveNumber value={today.amount} format={money} /></span>
          <span className="dash-hero-note">
            {today.count} төлбөр{payments[0] && ` · сүүлийнх ${timeAgo(payments[0].paidAt, now)}`}
          </span>
        </Link>
      </section>

      {/* Анхааруулга — лифт, камер, дулаан (одоохондоо жишээ өгөгдөл) */}
      {alerts.length > 0 ? (
        <section className="dash-alerts" aria-labelledby="alert-title">
          <h2 id="alert-title"><i aria-hidden="true" />Анхааруулга · {alerts.length}</h2>
          <div className="dash-alert-grid">
            {alerts.map((a) => {
              const Icon = alertIcons[a.kind]
              return (
                <div key={a.id} className="dash-alert">
                  <span className={`dash-alert-icon ${a.kind}`}><Icon sx={{ fontSize: 22 }} /></span>
                  <span className="dash-alert-text">
                    <strong>{a.title}</strong>
                    <span>{a.note} · {a.minutesAgo < 60 ? `${a.minutesAgo} мин өмнө` : `${Math.floor(a.minutesAgo / 60)} цагийн өмнө`}</span>
                  </span>
                  <button type="button" className="dash-btn-line" onClick={() => setAckedAlerts((m) => ({ ...m, [a.id]: true }))}>
                    Хүлээж авлаа
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="dash-allok" aria-label="Байрны систем">
          <CheckCircleOutlined sx={{ fontSize: 20 }} />
          Лифт, камер, дулаан — бүгд хэвийн ажиллаж байна
          {ackedCount > 0 && <span>· {ackedCount} анхааруулгыг хүлээж авсан</span>}
        </section>
      )}

      {actionError && <p className="dash-error" role="alert">{actionError}</p>}

      <div className="dash-grid">
        {/* Хүсэлт — хариугүй нь эхэндээ */}
        <section className="dash-card" aria-labelledby="req-title">
          <div className="dash-card-head">
            <div>
              <h2 id="req-title">Хүсэлт · <span className={unseen ? 'bad' : 'good'}>{unseen ? `${unseen} хариугүй` : 'бүгд хүлээж авсан'}</span></h2>
              <span className="dash-card-sub">Хариугүй нь эхэндээ</span>
            </div>
            <Link to="/admin/requests">Бүгд ({openRequests}) →</Link>
          </div>
          <div className="dash-reqs">
            {requests.map((r) => (
              <div key={r.id} className={r.seen ? 'dash-req seen' : 'dash-req'}>
                <span className="dash-req-meta">
                  <strong>{r.unit}</strong>{categoryLabels[r.category] ?? r.category}
                  {!r.seen && now - new Date(r.createdAt) < 3600000 && <span className="dash-tag new">Шинэ</span>}
                </span>
                <span className="dash-req-title">{r.title}</span>
                {r.seen ? (
                  <span className="dash-req-done"><CheckCircleOutlined sx={{ fontSize: 16 }} />Хүлээж авсан{r.who && ` · ${r.who}`}</span>
                ) : (
                  <span className="dash-req-actions">
                    <span className="dash-req-wait">{waitTime(r.createdAt, now)} хүлээж байна</span>
                    <button type="button" className="dash-btn-dark" onClick={() => acknowledge(r)}>Хүлээж авах</button>
                  </span>
                )}
              </div>
            ))}
            {!requests.length && <p className="dash-empty">Шийдээгүй хүсэлт алга</p>}
          </div>
        </section>

        {/* Сүүлийн төлбөр */}
        <section className="dash-card" aria-labelledby="feed-title">
          <div className="dash-card-head">
            <h2 id="feed-title"><i className="dash-dot" aria-hidden="true" />Сүүлийн төлбөр</h2>
            <Link to="/admin/invoices">Бүгд →</Link>
          </div>
          <ul className="dash-feed" aria-live="polite">
            {payments.map((p) => (
              <li key={p.id}>
                <span className="dash-unit">{p.unit}</span>
                <span className="dash-feed-who">
                  <span>{p.name}</span>
                  <small>{p.via} · {timeAgo(p.paidAt, now)}</small>
                </span>
                <span className="dash-feed-amount">+{money(p.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="dash-grid">
        {/* Өр ихтэй тоот */}
        <section className="dash-card" aria-labelledby="debt-title">
          <div className="dash-card-head">
            <h2 id="debt-title">Өр ихтэй тоот</h2>
            <Link to="/admin/invoices?tab=debtors">Бүгд →</Link>
          </div>
          {debtors.map((d) => {
            const state = reminded[d.code]
            return (
              <div key={d.unit_id} className="dash-debtor">
                <span className="dash-unit">{d.code}</span>
                <span className="dash-debtor-who">
                  <span>{d.name ?? 'Оршин суугчгүй'}</span>
                  <span className={d.months >= 2 ? 'dash-tag bad' : 'dash-tag warn'}>{d.months} сар хэтэрсэн</span>
                </span>
                <span className="dash-debtor-debt">{money(d.debt)}</span>
                <button
                  type="button"
                  className={state === 'sent' ? 'dash-btn-line sent' : 'dash-btn-line'}
                  disabled={Boolean(state)}
                  onClick={() => remind(d.code)}
                >
                  {state === 'sending' ? 'Илгээж байна…' : state === 'sent' ? 'SMS илгээсэн' : 'SMS сануулах'}
                </button>
              </div>
            )
          })}
          {!debtors.length && <p className="dash-empty">Өртэй тоот алга</p>}
        </section>

        {/* Санал хураалт · шууд ирц */}
        {poll ? (
          <Link to="/admin/polls" className={votePercent >= poll.threshold ? 'dash-poll reached' : 'dash-poll'}>
            <span className="dash-poll-tag"><i aria-hidden="true" />Санал хураалт · шууд ирц</span>
            <span className="dash-poll-title">{poll.title}</span>
            <span className="dash-poll-big">{poll.voted}<small> / {poll.units} тоот санал өгсөн</small></span>
            <span className="dash-poll-bar" role="img" aria-label={`Ирц ${votePercent}%, босго ${poll.threshold}%`}>
              <span style={{ width: `${Math.min(votePercent, 100)}%` }} />
              <i aria-hidden="true" style={{ left: `${poll.threshold}%` }} />
            </span>
            <span className="dash-poll-need">
              {voteNeed === 0 ? 'Босго хүрсэн — санал хураалт хүчинтэй боллоо' : `Босго хүртэл ${voteNeed} тоот дутуу`}
            </span>
            <span className="dash-poll-foot">Дуусах хүртэл {daysLeft} өдөр · Ирцийн босго {poll.threshold}%</span>
          </Link>
        ) : (
          <Link to="/admin/polls" className="dash-poll">
            <span className="dash-poll-tag">Санал хураалт</span>
            <span className="dash-poll-title">Одоогоор идэвхтэй санал хураалт алга</span>
            <span className="dash-poll-foot">Шинэ санал хураалт үүсгэх →</span>
          </Link>
        )}
      </div>
    </div>
  )
}
