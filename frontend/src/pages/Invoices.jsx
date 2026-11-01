import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import CheckOutlined from '@mui/icons-material/CheckOutlined'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import './styles/Invoices.css'

// Төлөв бүрийн нэр ба өнгө (CSS класс)
const statusLabels = {
  unpaid: 'Төлөгдөөгүй',
  partial: 'Хэсэгчилсэн',
  paid: 'Төлөгдсөн',
  overdue: 'Хугацаа хэтэрсэн',
}

const tabs = [
  { key: 'all', label: 'Бүгд' },
  { key: 'unpaid', label: 'Төлөгдөөгүй' },
  { key: 'partial', label: 'Хэсэгчилсэн' },
  { key: 'paid', label: 'Төлөгдсөн' },
  { key: 'overdue', label: 'Хэтэрсэн' },
  { key: 'debtors', label: 'Өр ихтэй' },
]

// 85000 → '85,000₮'
function money(n) {
  return `${n.toLocaleString('en-US')}₮`
}

const methodLabels = { cash: 'Бэлэн', bank: 'Данс', qpay: 'QPay', card: 'Карт' }

// '2026-09-01' → '9-р сар'
function monthLabel(period) {
  return `${Number(period.split('-')[1])}-р сар`
}

// { method: 'cash', paid_at: '2026-10-08 ...' } → 'Бэлэн · 10/08'
function lastLabel(p) {
  if (!p) return '—'
  const d = new Date(p.paid_at)
  return `${methodLabels[p.method] ?? p.method} · ${d.getMonth() + 1}/${String(d.getDate()).padStart(2, '0')}`
}

// /api/invoices-ийн мөр → хүснэгтийн мөр
function toRow(inv) {
  return {
    id: inv.id,
    unit: inv.unit_code,
    name: inv.resident_name ?? '—',
    period: monthLabel(inv.period),
    total: inv.amount,
    paid: inv.paid,
    status: inv.status, // backend хугацаа хэтэрснийг 'overdue' гэж тооцоод өгнө
    last: lastLabel(inv.last_payment),
  }
}

export default function Invoices() {
  const [searchParams] = useSearchParams()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // /invoices?tab=debtors гэж ирвэл тэр табаар нээгдэнэ (Dashboard-ийн "Бүгдийг харах")
  const [tab, setTab] = useState(searchParams.get('tab') ?? 'all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null) // төлбөр бүртгэж буй нэхэмжлэл
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [note, setNote] = useState('')
  const [toast, setToast] = useState('')
  const [debtors, setDebtors] = useState([])
  const [counts, setCounts] = useState({}) // табуудын тоо — /api/invoices/counts
  const [nextOffset, setNextOffset] = useState(null) // null бол дараагийн хуудас алга
  const sentinelRef = useRef(null) // хүснэгтийн доорх үл үзэгдэх div — харагдахад дараагийн хуудсыг татна
  const requestId = useRef(0) // таб/хайлт солигдоход хуучин хүсэлтийн хариуг хаяна

  // Өр ихтэй бүх тоот — Dashboard-ийн API-г limit-гүйгээр (бүгдийг) дуудна.
  // Backend өр ихээс нь эрэмбэлж, өргүй (0) тоотыг оруулдаггүй
  useEffect(() => {
    api.get('/dashboard/debtors', { params: { limit: 1000 } }).then(setDebtors)
  }, [])

  // Нэг хуудас нэхэмжлэл татна. offset 0 бол жагсаалтыг шинээр эхлүүлнэ, үгүй бол араас нь залгана.
  // Хуудаслалт, шүүлтийг backend хийнэ: { rows, has_more, next_offset }
  function loadPage(offset) {
    const id = ++requestId.current
    setLoading(true)

    const params = { offset }
    if (tab !== 'all') params.status = tab
    if (query.trim()) params.q = query.trim()

    api.get('/invoices', { params })
      .then((data) => {
        if (id !== requestId.current) return // энэ хооронд таб/хайлт солигдсон
        const page = data.rows.map(toRow)
        setRows((prev) => (offset === 0 ? page : [...prev, ...page]))
        setNextOffset(data.next_offset)
        setError('')
      })
      .catch((err) => {
        if (id === requestId.current) setError(err.message)
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false)
      })
  }

  // Таб, хайлт солигдоход эхний хуудаснаас дахин эхэлнэ.
  // Хайлтыг 300мс хүлээгээд илгээнэ — үсэг бүрд хүсэлт явуулахгүйн тулд
  useEffect(() => {
    if (tab === 'debtors') return // "Өр ихтэй" таб /dashboard/debtors-ийг ашиглана

    const timer = setTimeout(() => loadPage(0), 300)
    return () => clearTimeout(timer) // дахин бичвэл өмнөх хүлээлтийг цуцална
  }, [tab, query]) // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll — хүснэгтийн доод хэсэг дэлгэцэнд ойртоход (200px) дараагийн хуудсыг татна
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || nextOffset == null || loading) return

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadPage(nextOffset) },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [nextOffset, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  // Табуудын тоо — бүх табынх нэг дор. Таб солиход өөрчлөгдөхгүй, зөвхөн хайлтаас хамаарна
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = query.trim() ? { q: query.trim() } : {}
      api.get('/invoices/counts', { params }).then(setCounts).catch(() => setCounts({}))
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const now = new Date()
  // Төлөх хугацаа — дараа сарын 10 (12-р сард 1-р сар болно)
  const due = new Date(now.getFullYear(), now.getMonth() + 1, 10)

  // Таб бүрийн тоо: нэхэмжлэлийнх backend-ээс, "Өр ихтэй"-нх debtors-оос
  const tabCounts = { ...counts, debtors: debtors.length }

  const q = query.trim().toLowerCase()

  // Өр ихтэй таб — тоотын дугаараар хайна
  const visibleDebtors = debtors.filter((d) => !q || d.code.toLowerCase().includes(q))
  const totalDebt = visibleDebtors.reduce((sum, d) => sum + d.debt, 0)

  // Бүртгэх цонхны шалгалт — үлдэгдлээс их дүн оруулж болохгүй
  const left = selected ? selected.total - selected.paid : 0
  const amountNum = Number(amount.replace(/\D/g, '')) || 0
  const tooMuch = amountNum > left
  const cantSave = !selected || amountNum <= 0 || tooMuch

  function openPay(r) {
    setSelected(r)
    setAmount(String(r.total - r.paid))
    setMethod('cash')
    setNote('')
    setToast('')
  }

  function save() {
    if (cantSave) return
    const methodLabel = method === 'cash' ? 'Бэлэн' : 'Данс'
    // Түр — pay API нэмэгдэх хүртэл зөвхөн дэлгэц дээр шинэчилнэ (DB-д хадгалагдахгүй)
    setRows(rows.map((r) => {
      if (r.id !== selected.id) return r
      const paid = r.paid + amountNum
      const status = paid >= r.total ? 'paid' : r.status === 'overdue' ? 'overdue' : 'partial'
      return { ...r, paid, status, last: `${methodLabel} · одоо` }
    }))
    setToast(`${selected.unit} тоотод ${money(amountNum)} бүртгэгдлээ`)
    setSelected(null)
  }

  return (
    <div className="invoices">
      <header className="inv-header">
        <div>
          <span className="inv-muted">{now.getFullYear()} оны {now.getMonth() + 1}-р сар · төлөх хугацаа {due.getMonth() + 1}/{due.getDate()}</span>
          <h1>Нэхэмжлэл ба төлбөр</h1>
        </div>
        <div className="inv-header-actions">
          <span className="inv-auto">
            <CheckOutlined sx={{ fontSize: 16 }} />
            {now.getMonth() + 1}-р сарын {rows.length} нэхэмжлэл автоматаар үүссэн
          </span>
          <Link to="/invoices/settings" className="inv-btn">Хураамжийн тохиргоо</Link>
        </div>
      </header>

      <div className="inv-toolbar">
        <div className="inv-tabs" role="tablist" aria-label="Төлөвөөр шүүх">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={tab === t.key ? 'inv-tab active' : 'inv-tab'}
              onClick={() => setTab(t.key)}
            >
              {t.label} {tabCounts[t.key] != null && <span className="inv-tab-count">{tabCounts[t.key]}</span>}
            </button>
          ))}
        </div>

        <label className="inv-search">
          <SearchOutlined sx={{ fontSize: 18 }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Тоот эсвэл нэрээр хайх"
            aria-label="Тоот эсвэл нэрээр хайх"
          />
        </label>
      </div>

      {toast && (
        <div className="inv-toast" role="status">
          <CheckOutlined sx={{ fontSize: 18 }} />
          {toast}
        </div>
      )}

      {/* "Өр ихтэй" таб — нэхэмжлэл биш, тоот бүрийн нийт өрийг харуулна */}
      {tab === 'debtors' ? (
        <section className="inv-card" aria-label="Өр ихтэй тоотууд">
          <p className="inv-debtors-total">
            {visibleDebtors.length} тоот · нийт өр <strong>{money(totalDebt)}</strong>
          </p>
          <table className="inv-debtors-table">
            <thead>
              <tr>
                <th>Тоот</th>
                <th>Орц / давхар</th>
                <th className="num">Өр</th>
                <th>Хэтэрсэн</th>
              </tr>
            </thead>
            <tbody>
              {visibleDebtors.map((d) => (
                <tr key={d.unit_id}>
                  <td className="strong">{d.code}</td>
                  <td>{d.entrance}-р орц, {d.floor} давхар</td>
                  <td className="num strong">{money(d.debt)}</td>
                  <td><span className={d.months >= 2 ? 'inv-pill overdue' : 'inv-pill partial'}>{d.months} сар</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleDebtors.length === 0 && <p className="inv-empty">Өртэй тоот алга</p>}
        </section>
      ) : (
        <section className="inv-card" aria-label="Нэхэмжлэлийн жагсаалт">
          <table>
            <thead>
              <tr>
                <th>Тоот</th>
                <th>Оршин суугч</th>
                <th>Сар</th>
                <th className="num">Дүн</th>
                <th className="num">Төлсөн</th>
                <th className="num">Үлдэгдэл</th>
                <th>Төлөв</th>
                <th>Сүүлийн төлбөр</th>
                <th className="num">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = r.status
                return (
                  <tr key={r.id}>
                    <td className="strong">{r.unit}</td>
                    <td>{r.name}</td>
                    <td className="inv-muted">{r.period}</td>
                    <td className="num">{money(r.total)}</td>
                    <td className="num inv-muted">{money(r.paid)}</td>
                    <td className="num strong">{money(r.total - r.paid)}</td>
                    <td><span className={`inv-pill ${status}`}>{statusLabels[status]}</span></td>
                    <td className="inv-muted">{r.last}</td>
                    <td className="num">
                      {status !== 'paid' && (
                        <button className="inv-btn small" onClick={() => openPay(r)}>Бэлэн бүртгэх</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {error && <p className="inv-empty">{error}</p>}
          {!error && loading && <p className="inv-empty">{rows.length ? 'Цааш ачааллаж байна…' : 'Ачааллаж байна…'}</p>}
          {/* Энэ div дэлгэцэнд орж ирэхэд дараагийн хуудас татагдана */}
          {nextOffset != null && <div ref={sentinelRef} aria-hidden="true" />}
          {!error && !loading && rows.length === 0 && <p className="inv-empty">Тохирох нэхэмжлэл олдсонгүй</p>}
        </section>
      )}

      {/* Төлбөр бүртгэх цонх — баруун талаас гарна */}
      {selected && (
        <div className="inv-overlay" onClick={() => setSelected(null)}>
          {/* stopPropagation — цонхны дотор дарахад хаагдахгүй */}
          <div className="inv-drawer" role="dialog" aria-modal="true" aria-labelledby="pay-title" onClick={(e) => e.stopPropagation()}>
            <div className="inv-drawer-head">
              <div>
                <h2 id="pay-title">Төлбөр бүртгэх</h2>
                <span className="inv-muted">{selected.unit} тоот · {selected.name} · {selected.period}</span>
              </div>
              <button className="inv-close" onClick={() => setSelected(null)} aria-label="Хаах">
                <CloseOutlined sx={{ fontSize: 20 }} />
              </button>
            </div>

            <div className="inv-left">
              <span className="inv-muted">Үлдэгдэл</span>
              <span className="inv-left-value">{money(left)}</span>
            </div>

            <label className="inv-field">
              Төлсөн дүн (₮)
              <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            {tooMuch && <span className="inv-error">Үлдэгдлээс их дүн бүртгэх боломжгүй</span>}

            <label className="inv-field">
              Төлбөрийн хэлбэр
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="cash">Бэлэн мөнгө</option>
                <option value="bank">Дансаар шилжүүлсэн</option>
              </select>
            </label>

            <label className="inv-field">
              Тэмдэглэл
              <textarea
                rows="3"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Жишээ: жижүүрийн өрөөнд хүлээж авсан"
              />
            </label>

            <span className="inv-hint">
              Бүртгэсэн төлбөрийг устгах боломжгүй; алдаатай бол буцаалт бичлэг нэмнэ.
            </span>

            <div className="inv-drawer-actions">
              <button className="inv-btn" onClick={() => setSelected(null)}>Цуцлах</button>
              <button className="inv-btn primary" onClick={save} disabled={cantSave}>Бүртгэх</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
