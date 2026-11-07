import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import ImageOutlined from '@mui/icons-material/ImageOutlined'
import Badge from '../../components/UI/Badge'
import Button from '../../components/UI/Button'
import Card from '../../components/UI/Card'
import Field from '../../components/UI/Field'
import PageHeader from '../../components/UI/PageHeader'
import Tabs from '../../components/UI/Tabs'
import Toast from '../../components/UI/Toast'
import LiveBar from '../../components/admin/LiveBar'
import useApi from '../../hooks/useApi'
import useLive from '../../hooks/useLive'
import usePagedList from '../../hooks/usePagedList'
import useTabParam from '../../hooks/useTabParam'
import { liveRequests } from '../../samples/admin/live'
import './styles/Requests.css'

// Төлөв бүрийн нэр, шошгоны өнгө, дараагийн алхмын товчны бичиг
// stage-ийг backend status, assigned_to-оос гаргаж өгнө
const statusInfo = {
  new: { label: 'Шинэ', tone: 'red', action: 'Засварчин томилох' },
  assigned: { label: 'Томилсон', tone: 'orange', action: 'Ажил эхэлсэн гэж тэмдэглэх' },
  progress: { label: 'Хийгдэж буй', tone: 'navy', action: 'Шийдсэн гэж хаах' },
  done: { label: 'Шийдсэн', tone: 'green', action: '' },
}
const order = ['new', 'assigned', 'progress', 'done']

const tabs = [
  { key: 'open', label: 'Нээлттэй' }, // done-оос бусад бүгд
  { key: 'new', label: 'Шинэ' },
  { key: 'assigned', label: 'Томилсон' },
  { key: 'progress', label: 'Хийгдэж буй' },
  { key: 'done', label: 'Шийдсэн' },
]

const steps = ['Хүсэлт ирсэн', 'Засварчин томилсон', 'Ажил эхэлсэн', 'Шийдсэн']

const categoryLabels = {
  plumbing: 'Сантехник',
  electrical: 'Цахилгаан',
  cleaning: 'Цэвэрлэгээ',
  elevator: 'Лифт',
  other: 'Бусад',
}

// Түр жишээ засварчид — засварчны API нэмэгдэх хүртэл
const sampleTechs = [
  { id: 'bat', name: 'Бат-Эрдэнэ · сантехник' },
  { id: 'ganzo', name: 'Ганзориг · цахилгаан' },
  { id: 'clean', name: 'Цэвэрлэгээний баг' },
  { id: 'lift', name: 'Лифт Сервис ХХК · гэрээт' },
]

// '2026-11-14T08:20:00' → '11/14 08:20'
function timeLabel(value) {
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// /api/requests-ийн мөр → жагсаалтын мөр
function toRow(r) {
  return {
    id: r.id,
    unit: r.unit_code ?? '—',
    name: r.created_by_name ?? '—',
    cat: categoryLabels[r.category] ?? r.category,
    title: r.title,
    desc: r.description ?? '',
    time: timeLabel(r.created_at),
    status: r.stage,
    tech: r.assigned_to ? String(r.assigned_to) : '',
    techName: r.assigned_name, // DB-д томилогдсон засварчны нэр
  }
}

export default function Requests() {
  const live = useLive('requests', liveRequests) // "ШУУД" мөр — /api/admin/live/requests
  const { user } = useOutletContext()
  const isAdmin = user.role === 'admin' // оршин суугч зөвхөн харна, томилох/хаах товч admin-д л
  const [tab, setTab] = useTabParam('open') // /admin/requests?tab=new
  const [selId, setSelId] = useState(null) // дарж сонгосон хүсэлт
  const [toast, setToast] = useState('')

  // ---------- Server state ----------
  // Таб солигдоход эхний хуудаснаас дахин татна, доош гүйлгэхэд дараагийн хуудас
  const { rows: items, loading, error, setRows, sentinelRef } = usePagedList('/admin/requests', { stage: tab }, toRow)
  const { data: counts } = useApi('/admin/requests/counts', null, { fallback: {} }) // табуудын тоо

  // Derived — сонгосон нь энэ табд байхгүй (эсвэл юу ч сонгоогүй) бол эхнийх нь.
  // Тэгэхээр таб солиход "эхнийхийг сонгох" state шинэчлэл хэрэггүй
  const sel = items.find((r) => r.id === selId) ?? items[0]
  const step = sel ? order.indexOf(sel.status) : 0

  // DB-д засварчин томилогдсон бол сонголтод түүнийг ч нэмнэ
  const techOptions = sel?.techName && !sampleTechs.some((t) => t.id === sel.tech)
    ? [{ id: sel.tech, name: sel.techName }, ...sampleTechs]
    : sampleTechs

  function change(id, patch) {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function pick(r) {
    setSelId(r.id)
    setToast('')
  }

  // Дараагийн төлөв рүү — Шинэ → Томилсон бол засварчин сонгосон байх ёстой
  // Түр — төлөв солих API нэмэгдэх хүртэл зөвхөн дэлгэц дээр шинэчилнэ (DB-д хадгалагдахгүй)
  function advance() {
    if (sel.status === 'new' && !sel.tech) {
      setToast('Эхлээд хариуцах засварчнаа сонгоно уу')
      return
    }
    const next = order[step + 1]
    change(sel.id, { status: next })
    setToast(
      next === 'assigned' ? `${sel.unit} тоотын хүсэлтэд засварчин томилогдлоо`
        : next === 'progress' ? `R-${sel.id} ажил эхэлсэн гэж тэмдэглэлээ`
          : `R-${sel.id} шийдэгдлээ`,
    )
  }

  return (
    <div className="requests">
      {/* Шууд мөр — түр жишээ өгөгдөлтэй */}
      <LiveBar stats={live.stats} events={live.events} />

      <PageHeader sub={`${counts.open ?? 0} нээлттэй`} title="Засварын хүсэлт">
        <Tabs
          label="Төлөвөөр шүүх"
          items={tabs.map((t) => ({ ...t, count: counts[t.key] }))}
          value={tab}
          onChange={setTab}
        />
      </PageHeader>

      <Toast>{toast}</Toast>

      {error && <p className="requests-error" role="alert">{error}</p>}

      <div className="requests-columns">
        <section className="requests-list" aria-label="Хүсэлтийн жагсаалт" aria-busy={loading}>
          {items.map((r) => (
            <button
              key={r.id}
              aria-pressed={r.id === sel.id}
              className={r.id === sel.id ? 'requests-row selected' : 'requests-row'}
              onClick={() => pick(r)}
            >
              <span className="requests-row-meta"><b>R-{r.id}</b> {r.unit} тоот · {r.cat}</span>
              <span className="requests-row-status">
                <Badge tone={statusInfo[r.status].tone}>{statusInfo[r.status].label}</Badge>
              </span>
              <span className="requests-row-title">{r.title}</span>
              <span className="requests-row-time">{r.time}</span>
            </button>
          ))}

          {!loading && !error && items.length === 0 && <p className="requests-empty">Энэ төлөвт хүсэлт алга</p>}
          {loading && <p className="requests-empty">Ачаалж байна…</p>}

          {/* Энэ div харагдахад дараагийн хуудас татагдана */}
          <div ref={sentinelRef} aria-hidden="true" />
        </section>

        {sel && (
          <Card as="aside" className="requests-detail" aria-labelledby="detail-title">
            <div className="requests-detail-head">
              <div>
                <span className="requests-sub">R-{sel.id} · {sel.time}</span>
                <h2 id="detail-title">{sel.title}</h2>
              </div>
              <Badge tone={statusInfo[sel.status].tone}>{statusInfo[sel.status].label}</Badge>
            </div>

            <div className="requests-facts">
              <div><span>Тоот</span><b>{sel.unit} · {sel.name}</b></div>
              <div><span>Ангилал</span><b>{sel.cat}</b></div>
            </div>

            {sel.desc && <p className="requests-desc">{sel.desc}</p>}

            <div className="requests-photo" role="img" aria-label="Оршин суугчийн хавсаргасан зураг">
              <ImageOutlined sx={{ fontSize: 20 }} /> Зураг хавсаргаагүй
            </div>

            {isAdmin && (
              <Field label="Хариуцах засварчин">
                <select
                  value={sel.tech}
                  disabled={sel.status === 'done'}
                  onChange={(e) => change(sel.id, { tech: e.target.value })}
                >
                  <option value="">Сонгох…</option>
                  {techOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
            )}

            <ol className="requests-steps" aria-label="Явц">
              {steps.map((label, i) => (
                <li key={label} className={i <= step ? (i === step ? 'done current' : 'done') : ''}>
                  <span className="requests-step-dot">{i + 1}</span>{label}
                </li>
              ))}
            </ol>

            {isAdmin && sel.status !== 'done' && (
              <Button variant="dark" onClick={advance}>{statusInfo[sel.status].action}</Button>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
