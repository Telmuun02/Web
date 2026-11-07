import { useState } from 'react'
import { Link } from 'react-router-dom'
import CheckOutlined from '@mui/icons-material/CheckOutlined'
import Badge from '../../components/UI/Badge'
import Button from '../../components/UI/Button'
import Card from '../../components/UI/Card'
import PageHeader from '../../components/UI/PageHeader'
import SearchInput from '../../components/UI/SearchInput'
import Table from '../../components/UI/Table'
import Tabs from '../../components/UI/Tabs'
import Toast from '../../components/UI/Toast'
import PayDrawer from '../../components/admin/PayDrawer'
import LiveBar from '../../components/admin/LiveBar'
import useApi from '../../hooks/useApi'
import useLive from '../../hooks/useLive'
import usePagedList from '../../hooks/usePagedList'
import useTabParam from '../../hooks/useTabParam'
import { liveInvoices } from '../../samples/admin/live'
import './styles/Invoices.css'

// Төлөв бүрийн нэр ба шошгоны өнгө
const statusInfo = {
  unpaid: { label: 'Төлөгдөөгүй', tone: 'gray' },
  partial: { label: 'Хэсэгчилсэн', tone: 'orange' },
  paid: { label: 'Төлөгдсөн', tone: 'green' },
  overdue: { label: 'Хугацаа хэтэрсэн', tone: 'red' },
}

const tabs = [
  { key: 'all', label: 'Бүгд' },
  { key: 'unpaid', label: 'Төлөгдөөгүй' },
  { key: 'partial', label: 'Хэсэгчилсэн' },
  { key: 'paid', label: 'Төлөгдсөн' },
  { key: 'overdue', label: 'Хэтэрсэн' },
  { key: 'debtors', label: 'Өр ихтэй' },
]

const invoiceColumns = [
  { label: 'Тоот' },
  { label: 'Оршин суугч' },
  { label: 'Сар' },
  { label: 'Дүн', align: 'right' },
  { label: 'Төлсөн', align: 'right' },
  { label: 'Үлдэгдэл', align: 'right' },
  { label: 'Төлөв' },
  { label: 'Сүүлийн төлбөр' },
  { label: 'Үйлдэл', align: 'right' },
]

const debtorColumns = [
  { label: 'Тоот' },
  { label: 'Орц / давхар' },
  { label: 'Өр', align: 'right' },
  { label: 'Хэтэрсэн' },
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
  const live = useLive('invoices', liveInvoices) // "ШУУД" мөр — /api/admin/live/invoices
  // /admin/invoices?tab=debtors гэж ирвэл тэр табаар нээгдэнэ (Dashboard-ийн "Бүгдийг харах")
  const [tab, setTab] = useTabParam('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null) // төлбөр бүртгэж буй нэхэмжлэл
  const [toast, setToast] = useState('')

  // ---------- Server state ----------
  // undefined утгатай param-ыг axios илгээдэггүй
  const q = query.trim() || undefined
  const status = tab === 'all' ? undefined : tab

  // Нэхэмжлэлийн жагсаалт. "Өр ихтэй" таб өөр API-тай тул тэр үед татахгүй (url = null).
  // Хайлтыг 300мс хүлээгээд илгээнэ
  const { rows, loading, error, next: nextOffset, setRows, sentinelRef } = usePagedList(
    tab === 'debtors' ? null : '/admin/invoices',
    { status, q },
    toRow,
    { delay: 300 },
  )
  // Табуудын тоо — таб солиход өөрчлөгдөхгүй, зөвхөн хайлтаас хамаарна
  const { data: counts } = useApi('/admin/invoices/counts', { q }, { fallback: {}, delay: 300 })
  // Өр ихтэй бүх тоот — backend өр ихээс нь эрэмбэлж, өргүй тоотыг оруулдаггүй
  const { data: debtors } = useApi('/admin/dashboard/debtors', { limit: 1000 }, { fallback: [] })

  const now = new Date()
  // Төлөх хугацаа — дараа сарын 10 (12-р сард 1-р сар болно)
  const due = new Date(now.getFullYear(), now.getMonth() + 1, 10)

  // Таб бүрийн тоо: нэхэмжлэлийнх backend-ээс, "Өр ихтэй"-нх debtors-оос
  const tabCounts = { ...counts, debtors: debtors.length }

  // Өр ихтэй таб — тоотын дугаараар хайна
  const search = query.trim().toLowerCase()
  const visibleDebtors = debtors.filter((d) => !search || d.code.toLowerCase().includes(search))
  const totalDebt = visibleDebtors.reduce((sum, d) => sum + d.debt, 0)

  function openPay(r) {
    setSelected(r)
    setToast('')
  }

  // PayDrawer-ийн "Бүртгэх" — { amount, method } ирнэ.
  // Түр — pay API нэмэгдэх хүртэл зөвхөн дэлгэц дээр шинэчилнэ (DB-д хадгалагдахгүй)
  function applyPayment({ amount, method }) {
    setRows((list) => list.map((r) => {
      if (r.id !== selected.id) return r
      const paid = r.paid + amount
      const status = paid >= r.total ? 'paid' : r.status === 'overdue' ? 'overdue' : 'partial'
      return { ...r, paid, status, last: `${methodLabels[method]} · одоо` }
    }))
    setToast(`${selected.unit} тоотод ${money(amount)} бүртгэгдлээ`)
    setSelected(null)
  }

  return (
    <div className="invoices">
      {/* Шууд мөр — түр жишээ өгөгдөлтэй */}
      <LiveBar stats={live.stats} events={live.events} />

      <PageHeader
        sub={`${now.getFullYear()} оны ${now.getMonth() + 1}-р сар · төлөх хугацаа ${due.getMonth() + 1}/${due.getDate()}`}
        title="Нэхэмжлэл ба төлбөр"
      >
        <span className="inv-auto">
          <CheckOutlined sx={{ fontSize: 16 }} />
          {now.getMonth() + 1}-р сарын {rows.length} нэхэмжлэл автоматаар үүссэн
        </span>
        <Button as={Link} to="/admin/invoices/settings">Хураамжийн тохиргоо</Button>
      </PageHeader>

      <div className="inv-toolbar">
        <Tabs
          label="Төлөвөөр шүүх"
          items={tabs.map((t) => ({ ...t, count: tabCounts[t.key] }))}
          value={tab}
          onChange={setTab}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="Тоот эсвэл нэрээр хайх" />
      </div>

      <Toast>{toast}</Toast>

      {/* "Өр ихтэй" таб — нэхэмжлэл биш, тоот бүрийн нийт өрийг харуулна */}
      {tab === 'debtors' ? (
        <Card aria-label="Өр ихтэй тоотууд">
          <p className="inv-debtors-total">
            {visibleDebtors.length} тоот · нийт өр <strong>{money(totalDebt)}</strong>
          </p>
          <Table columns={debtorColumns} minWidth={460}>
            {visibleDebtors.map((d) => (
              <tr key={d.unit_id}>
                <td className="bold">{d.code}</td>
                <td>{d.entrance}-р орц, {d.floor} давхар</td>
                <td className="num bold">{money(d.debt)}</td>
                <td><Badge tone={d.months >= 2 ? 'red' : 'orange'}>{d.months} сар</Badge></td>
              </tr>
            ))}
          </Table>
          {visibleDebtors.length === 0 && <p className="inv-empty">Өртэй тоот алга</p>}
        </Card>
      ) : (
        <Card aria-label="Нэхэмжлэлийн жагсаалт">
          <Table columns={invoiceColumns} minWidth={820}>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="bold">{r.unit}</td>
                <td>{r.name}</td>
                <td className="dim">{r.period}</td>
                <td className="num">{money(r.total)}</td>
                <td className="num dim">{money(r.paid)}</td>
                <td className="num bold">{money(r.total - r.paid)}</td>
                <td><Badge tone={statusInfo[r.status].tone}>{statusInfo[r.status].label}</Badge></td>
                <td className="dim">{r.last}</td>
                <td className="num">
                  {r.status !== 'paid' && (
                    <Button size="small" onClick={() => openPay(r)}>Бэлэн бүртгэх</Button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
          {error && <p className="inv-empty">{error}</p>}
          {!error && loading && <p className="inv-empty">{rows.length ? 'Цааш ачааллаж байна…' : 'Ачааллаж байна…'}</p>}
          {/* Энэ div дэлгэцэнд орж ирэхэд дараагийн хуудас татагдана */}
          {nextOffset != null && <div ref={sentinelRef} aria-hidden="true" />}
          {!error && !loading && rows.length === 0 && <p className="inv-empty">Тохирох нэхэмжлэл олдсонгүй</p>}
        </Card>
      )}

      {/* Төлбөр бүртгэх цонх — хаагдахад (selected = null) component устана */}
      {selected && <PayDrawer invoice={selected} onClose={() => setSelected(null)} onSave={applyPayment} />}
    </div>
  )
}
