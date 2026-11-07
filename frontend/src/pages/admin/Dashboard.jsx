import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import AddOutlined from '@mui/icons-material/AddOutlined'
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined'
import Avatar from '../../components/UI/Avatar'
import Badge from '../../components/UI/Badge'
import Button from '../../components/UI/Button'
import Card from '../../components/UI/Card'
import PageHeader from '../../components/UI/PageHeader'
import ProgressBar from '../../components/UI/ProgressBar'
import StatCard from '../../components/UI/StatCard'
import Table from '../../components/UI/Table'
// Backend-тэй түр холбоогүй — бүх өгөгдөл жишээ файлаас
import {
  liftFloors, sampleCameras, sampleDebtors, sampleHours, sampleLifts, sampleLog, sampleMonths,
  sampleOnline, samplePayments, samplePoll, sampleRequests, sampleStats, sampleSupplyTemp,
  sampleTemps, sampleUtilities,
} from '../../samples/admin/dashboard'
import './styles/Dashboard.css'
import useNow from '../../hooks/useNow'

const chartTop = 12000000 // ₮ — графикийн дээд хязгаар (12 сая)
const lowTemp = 20        // °C — үүнээс доош бол хүйтэн

const debtorColumns = [
  { label: 'Тоот' },
  { label: 'Оршин суугч' },
  { label: 'Өр', align: 'right' },
  { label: 'Хэтэрсэн' },
  { label: 'Апп-д сүүлд' },
  { label: 'Үйлдэл', align: 'right' },
]

// Backend-ийн ангиллын нэр → харуулах нэр (requests.category enum)
const categoryLabels = {
  plumbing: 'Сантехник',
  electrical: 'Цахилгаан',
  cleaning: 'Цэвэрлэгээ',
  elevator: 'Лифт',
  other: 'Бусад',
}

// 170000 → '170,000₮'
function money(n) {
  return `${n.toLocaleString('en-US')}₮`
}

// 7900000 → '7.9'
function million(n) {
  return (n / 1000000).toFixed(1)
}

// Хэдий хугацааны өмнө болсныг үгээр: '40 сек өмнө', '7 мин өмнө'
function timeAgo(date, now) {
  const sec = Math.floor((now - date) / 1000)
  if (sec < 5) return 'дөнгөж сая'
  if (sec < 60) return `${sec} сек өмнө`
  if (sec < 3600) return `${Math.floor(sec / 60)} мин өмнө`
  return `${Math.floor(sec / 3600)} цагийн өмнө`
}

// Хариугүй хүлээсэн хугацаа: '45 сек', '7 мин'
function waitTime(date, now) {
  const sec = Math.floor((now - date) / 1000)
  return sec < 60 ? `${sec} сек` : `${Math.floor(sec / 60)} мин`
}

// Ногоон/улаан анивчдаг цэг — "шууд" гэдгийг илэрхийлнэ
function LiveDot({ tone = 'green' }) {
  return <span className={`live-dot ${tone}`} aria-hidden="true" />
}

export default function Dashboard() {
  const { user } = useOutletContext()

  // Секунд тутам шинэчлэгдэх цаг — дээрх цаг, "40 сек өмнө" зэрэг бичиг үүгээр өөрчлөгдөнө
  const now = useNow()

  // Товч дарахад өөрчлөгдөх хэсгүүд — одоохондоо зөвхөн дэлгэц дээр (backend-д хадгалахгүй)
  const [requests, setRequests] = useState(sampleRequests)
  const [log, setLog] = useState(sampleLog)
  const [reminded, setReminded] = useState({}) // SMS илгээсэн тоотууд: { '1-12': true }

  // "Хүлээж авах" — хүсэлтийг харсан болгоод, ажилтны үйлдэлд нэмнэ
  function acknowledge(request) {
    setRequests((list) => list.map((r) => (r.id === request.id ? { ...r, seen: true } : r)))
    setLog((list) => [
      { id: Date.now(), who: user.name, what: `R-${request.id} хүсэлтийг хүлээж авав`, at: new Date() },
      ...list,
    ].slice(0, 4))
  }

  function remind(code) {
    setReminded((map) => ({ ...map, [code]: true }))
  }

  // Картуудын тоо
  const { today, month, openRequests, online } = sampleStats
  const paidPercent = Math.round((month.paidUnits / month.units) * 100)
  const unseen = requests.filter((r) => !r.seen).length

  const liftsDown = sampleLifts.filter((l) => !l.ok).length
  const camsOnline = sampleCameras.filter((c) => c.online).length
  const coldEntrances = sampleTemps.filter((t) => t.value < lowTemp).length
  const alerts = liftsDown + (sampleCameras.length - camsOnline) + coldEntrances

  // Графикуудын өндрийг хамгийн их утгатай харьцуулж бодно
  const hourTop = Math.max(400000, ...sampleHours.map((h) => h.amount))
  const onlineTop = 60

  const votePercent = Math.round((samplePoll.voted / samplePoll.units) * 100)
  const voteNeed = Math.ceil((samplePoll.units * samplePoll.threshold) / 100) - samplePoll.voted

  // 14:03:22
  const clock = new Date(now).toLocaleTimeString('en-GB')
  const currentMonth = Number(sampleMonths.at(-1).period.split('-')[1])

  return (
    <div className="dashboard">
      <PageHeader
        sub={<>Сайн байна уу, <Link to="/admin/profile" className="dash-user">{user.name}</Link></>}
        title="Шууд самбар"
        note={<span className="dash-live"><LiveDot />ШУУД · {clock}</span>}
      >
        <label className="dash-field">
          <span>Байр</span>
          <select>
            <option>Бүгд (3 орц)</option>
            <option>1-р орц</option>
            <option>2-р орц</option>
            <option>3-р орц</option>
          </select>
        </label>
        <Button>
          <FileDownloadOutlined sx={{ fontSize: 16 }} /> Excel татах
        </Button>
        <Button as={Link} to="/admin/announcements" variant="primary">
          <AddOutlined sx={{ fontSize: 16 }} /> Зарлал нийтлэх
        </Button>
      </PageHeader>

      {/* Дээд талын 5 карт */}
      <div className="dash-stats">
        <StatCard label="Өнөөдөр цугласан" value={money(today.amount)} note={`${today.count} төлбөр орсон`} tone="dark" />
        <StatCard
          label="Сарын төлөлт"
          value={`${paidPercent}%`}
          note={`${month.paidUnits}/${month.units} тоот · ${million(month.collected)} / ${million(month.billed)} сая₮`}
        >
          <ProgressBar value={paidPercent} size={6} color="var(--yellow)" />
        </StatCard>
        <StatCard
          label="Нээлттэй хүсэлт"
          value={openRequests}
          note={unseen ? `${unseen} нь хариугүй байна` : 'Бүгдийг хүлээж авсан'}
          noteTone={unseen ? 'bad' : 'good'}
        />
        <StatCard label="Апп-д онлайн" value={online} note="оршин суугч яг одоо" />
        <StatCard label="Анхааруулга" value={alerts} note="Лифт · камер · дулаан" tone={alerts ? 'alert' : undefined} />
      </div>

      <div className="dash-row">
        {/* Төлбөрийн урсгал */}
        <Card
          title={<><LiveDot />Төлбөрийн урсгал</>}
          action={<Link to="/admin/invoices" className="dash-link">Бүгд →</Link>}
          className="dash-feed"
        >
          <div className="hour-bars" role="img" aria-label="Өнөөдрийн цагийн орлогын график">
            {sampleHours.map((h, i) => (
              <span key={h.label} className="hour">
                <span
                  className={i === sampleHours.length - 1 ? 'hour-bar current' : 'hour-bar'}
                  style={{ height: `${(h.amount / hourTop) * 100}%` }}
                />
                <span className="hour-label">{h.label}</span>
              </span>
            ))}
          </div>
          <ul className="feed">
            {samplePayments.map((p) => (
              <li key={p.id} className="feed-item">
                <span className="bold">{p.unit}</span>
                <span className="feed-who">
                  <span className="feed-name">{p.name}</span>
                  <span className="dim">{p.via} · {timeAgo(p.paidAt, now)}</span>
                </span>
                <span className="feed-amount">+{money(p.amount)}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Шинэ хүсэлт */}
        <Card
          title={<><LiveDot tone="red" />Шинэ хүсэлт</>}
          action={<Link to="/admin/requests" className="dash-link">Бүгд →</Link>}
          className="dash-requests"
        >
          {requests.map((r) => (
            <div key={r.id} className={r.seen ? 'req' : `req unseen${r.urgent ? ' urgent' : ''}`}>
              <span className="req-meta">
                <strong>{r.unit}</strong> · {categoryLabels[r.category] ?? r.category} · {timeAgo(r.createdAt, now)}
                {r.urgent && <Badge tone="red" small>Яаралтай</Badge>}
              </span>
              <span className="req-title">{r.title}</span>
              {r.seen ? (
                <span className="req-seen">Хүлээж авсан</span>
              ) : (
                <span className="req-actions">
                  <span className="req-wait">Хариугүй · {waitTime(r.createdAt, now)}</span>
                  <Button variant="dark" size="small" onClick={() => acknowledge(r)}>Хүлээж авах</Button>
                </span>
              )}
            </div>
          ))}
        </Card>
      </div>

      {/* Байрны систем — лифт, дулаан, ус/цахилгаан, камер */}
      <Card title={<><LiveDot />Байрны систем</>}>
        <div className="systems">
          <div className="system">
            <span className="system-title">Лифт</span>
            <div className="lifts">
              {sampleLifts.map((l) => (
                <div key={l.name} className={l.ok ? 'lift' : 'lift down'}>
                  <span className="lift-name">{l.name}</span>
                  {/* Давхар бүрд нэг нүд — лифт байгаа давхар нь тод */}
                  <span className="lift-shaft" aria-hidden="true">
                    {Array.from({ length: liftFloors }, (_, i) => (
                      <span key={i} className={i + 1 === l.floor ? 'lift-cell here' : 'lift-cell'} />
                    ))}
                  </span>
                  <span className="lift-floor">{l.floor}{l.ok && (l.dir === 'up' ? ' ↑' : ' ↓')}</span>
                  <span className="lift-status">{l.ok ? 'Ажиллаж байна' : l.note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="system">
            <span className="system-title">Дулаан (орцны дундаж)</span>
            {sampleTemps.map((t) => (
              <div key={t.name} className={t.value < lowTemp ? 'temp cold' : 'temp'}>
                <span>{t.name}</span>
                {/* 15°C → 0%, 25°C → 100% */}
                <ProgressBar value={((t.value - 15) / 10) * 100} color={t.value < lowTemp ? '#3b8fd9' : 'var(--yellow)'} />
                <span className="temp-value">{t.value.toFixed(1)}°C</span>
              </div>
            ))}
            <span className="dim small">Хэвийн: 20–24°C · Шугамын ус {sampleSupplyTemp.toFixed(1)}°C</span>
          </div>

          <div className="system">
            <span className="system-title">Ус ба цахилгаан</span>
            <div className="utilities">
              {sampleUtilities.map((u) => (
                <div key={u.label} className="utility">
                  <span className="dim small">{u.label}</span>
                  <span className="utility-value">{u.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="system">
            <span className="system-title">Камер · {camsOnline}/{sampleCameras.length} онлайн</span>
            {sampleCameras.map((c) => (
              <div key={c.name} className={c.online ? 'camera' : 'camera off'}>
                <span className="camera-dot" aria-hidden="true" />
                <span className="camera-name">{c.name}</span>
                <span className="camera-status">{c.online ? 'Онлайн' : c.note}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="dash-trio">
        <Link to="/admin/polls" className="poll-card">
          <span className="poll-tag"><LiveDot tone="orange" />Санал хураалт · шууд ирц</span>
          <span className="poll-title">{samplePoll.title}</span>
          <ProgressBar
            value={votePercent}
            size={12}
            track="rgba(122, 67, 0, 0.15)"
            marker={samplePoll.threshold}
            label={`Ирц ${votePercent}%, босго ${samplePoll.threshold}%`}
          />
          <span className="poll-note">
            {samplePoll.voted}/{samplePoll.units} тоот · {votePercent}% · {voteNeed > 0 ? `босго хүртэл ${voteNeed} тоот` : 'босго хүрсэн'}
          </span>
        </Link>

        <Card title="Апп-ын идэвх · сүүлийн 30 мин" className="dash-small">
          <div className="spark" role="img" aria-label="Онлайн хэрэглэгчдийн тоо минут тутам">
            {sampleOnline.map((v, i) => (
              <span
                key={i}
                className={i === sampleOnline.length - 1 ? 'spark-bar current' : 'spark-bar'}
                style={{ height: `${(v / onlineTop) * 100}%` }}
              />
            ))}
          </div>
          <span className="dim">Одоо {online} · 34 айл хуралд бүртгүүлсэн · 96 тоот апп-тай</span>
        </Card>

        <Card title="Ажилтны үйлдэл" className="dash-small">
          {log.map((g) => (
            <div key={g.id} className="log-item">
              <Avatar name={g.who} dark />
              <span className="log-text">
                <span><strong>{g.who}</strong> {g.what}</span>
                <span className="dim small">{timeAgo(g.at, now)}</span>
              </span>
            </div>
          ))}
        </Card>
      </div>

      <Card
        title="Сүүлийн 12 сарын орлого"
        sub={`${currentMonth}-р сар явж байна`}
        action={(
          <div className="legend">
            <span><i className="swatch billed" />Нэхэмжилсэн</span>
            <span><i className="swatch collected" />Цугларсан</span>
          </div>
        )}
      >
        <div className="chart">
          <div className="chart-axis" aria-hidden="true">
            <span>12 сая</span><span>8</span><span>4</span><span>0</span>
          </div>
          <div className="chart-body" role="img" aria-label="12 сарын нэхэмжилсэн ба цугларсан дүнгийн баганан график">
            <div className="chart-bars">
              {sampleMonths.map((m, i) => (
                <div key={m.period} className="bar" style={{ height: `${(m.billed / chartTop) * 100}%` }}>
                  <div
                    className={i === sampleMonths.length - 1 ? 'bar-fill current' : 'bar-fill'}
                    style={{ height: `${m.billed ? (m.collected / m.billed) * 100 : 0}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="chart-labels">
              {/* '2026-10-01' → 10 */}
              {sampleMonths.map((m) => <span key={m.period}>{Number(m.period.split('-')[1])}</span>)}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Өр ихтэй тоотууд" action={<Link to="/admin/invoices?tab=debtors" className="dash-link">Бүгдийг харах →</Link>}>
        <Table columns={debtorColumns} minWidth={560}>
          {sampleDebtors.map((d) => (
            <tr key={d.unit_id}>
              <td className="bold">{d.code}</td>
              <td>{d.name}</td>
              <td className="num bold">{money(d.debt)}</td>
              <td><Badge tone={d.months >= 2 ? 'red' : 'orange'}>{d.months} сар</Badge></td>
              <td className={d.last_seen === 'Одоо онлайн' ? 'seen-online' : 'dim'}>{d.last_seen}</td>
              <td className="num">
                <Button size="small" onClick={() => remind(d.code)} disabled={reminded[d.code]}>
                  {reminded[d.code] ? 'Илгээсэн' : 'SMS сануулах'}
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
