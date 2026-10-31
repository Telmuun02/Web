import { useState } from 'react'
import { Link } from 'react-router-dom'
import CheckOutlined from '@mui/icons-material/CheckOutlined'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import './styles/Invoices.css'

// Түр жишээ өгөгдөл — backend-ийн /api/invoices бэлэн болоход солигдоно
const sampleRows = [
  { id: 1, unit: '1-12', name: 'Ганболд Т.', period: '9-р сар', total: 85000, paid: 0, last: '—', overdue: true },
  { id: 2, unit: '2-31', name: 'Мөнхбат Э.', period: '9-р сар', total: 85000, paid: 0, last: '—', overdue: true },
  { id: 3, unit: '3-07', name: 'Сарантуяа Б.', period: '9-р сар', total: 85000, paid: 0, last: '—', overdue: true },
  { id: 4, unit: '2-05', name: 'Болор А.', period: '10-р сар', total: 85000, paid: 0, last: '—', overdue: false },
  { id: 5, unit: '1-05', name: 'Оюун Д.', period: '10-р сар', total: 92400, paid: 0, last: '—', overdue: false },
  { id: 6, unit: '3-24', name: 'Тэмүүлэн Г.', period: '10-р сар', total: 85000, paid: 40000, last: 'Бэлэн · 10/08', overdue: false },
  { id: 7, unit: '2-18', name: 'Нарантуяа С.', period: '10-р сар', total: 85000, paid: 0, last: '—', overdue: false },
  { id: 8, unit: '1-03', name: 'Энхтуяа Б.', period: '10-р сар', total: 85000, paid: 85000, last: 'QPay · 10/03', overdue: false },
  { id: 9, unit: '3-12', name: 'Даваа Ц.', period: '10-р сар', total: 101200, paid: 101200, last: 'Бэлэн · 10/05', overdue: false },
  { id: 10, unit: '1-27', name: 'Хулан М.', period: '10-р сар', total: 85000, paid: 85000, last: 'QPay · 10/10', overdue: false },
]

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
]

// 85000 → '85,000₮'
function money(n) {
  return `${n.toLocaleString('en-US')}₮`
}

// Нэхэмжлэлийн төлөвийг дүнгээс нь тодорхойлно
function statusOf(r) {
  if (r.total - r.paid <= 0) return 'paid'
  if (r.overdue) return 'overdue'
  if (r.paid > 0) return 'partial'
  return 'unpaid'
}

export default function Invoices() {
  const [rows, setRows] = useState(sampleRows)
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null) // төлбөр бүртгэж буй нэхэмжлэл
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [note, setNote] = useState('')
  const [toast, setToast] = useState('')

  const now = new Date()
  // Төлөх хугацаа — дараа сарын 10 (12-р сард 1-р сар болно)
  const due = new Date(now.getFullYear(), now.getMonth() + 1, 10)

  // Таб бүрийн тоо
  const counts = { all: rows.length, unpaid: 0, partial: 0, paid: 0, overdue: 0 }
  rows.forEach((r) => counts[statusOf(r)]++)

  // Таб болон хайлтаар шүүнэ
  const q = query.trim().toLowerCase()
  const visibleRows = rows.filter((r) => {
    if (tab !== 'all' && statusOf(r) !== tab) return false
    if (q && !`${r.unit} ${r.name}`.toLowerCase().includes(q)) return false
    return true
  })

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
    setRows(rows.map((r) =>
      r.id === selected.id ? { ...r, paid: r.paid + amountNum, last: `${methodLabel} · одоо` } : r
    ))
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
              {t.label} <span className="inv-tab-count">{counts[t.key]}</span>
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
            {visibleRows.map((r) => {
              const status = statusOf(r)
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
        {visibleRows.length === 0 && <p className="inv-empty">Тохирох нэхэмжлэл олдсонгүй</p>}
      </section>

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
