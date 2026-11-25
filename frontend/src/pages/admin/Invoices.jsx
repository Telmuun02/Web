/**
 * Төлбөр, нэхэмжлэл — /admin/invoices
 * Табууд: бүгд / төлөөгүй / хэсэгчилсэн / төлсөн / хугацаа хэтэрсэн / өр ихтэй (?tab=).
 * Хайлт, таб бүгд backend дээр шүүгдэнэ (300мс хүлээгээд ?q= илгээнэ), жагсаалт infinite scroll.
 * GET /api/admin/invoices, /admin/invoices/counts, /admin/dashboard/debtors
 * POST /api/admin/invoices/:id/payments — төлбөр бүртгэх (PayDrawer)
 */

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
import api from '../../api/client'
import useApi from '../../hooks/useApi'
import useLive from '../../hooks/useLive'
import usePagedList from '../../hooks/usePagedList'
import useTabParam from '../../hooks/useTabParam'
import './styles/Invoices.css'

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

function money(n) {
  return `${n.toLocaleString('en-US')}₮`
}

const methodLabels = { cash: 'Бэлэн', bank: 'Данс', qpay: 'QPay', card: 'Карт' }

function monthLabel(period) {
  return `${Number(period.split('-')[1])}-р сар`
}

function lastLabel(p) {
  if (!p) return '—'
  const d = new Date(p.paid_at)
  return `${methodLabels[p.method] ?? p.method} · ${d.getMonth() + 1}/${String(d.getDate()).padStart(2, '0')}`
}

function toRow(inv) {
  return {
    id: inv.id,
    unit: inv.unit_code,
    name: inv.resident_name ?? '—',
    period: monthLabel(inv.period),
    total: inv.amount,
    paid: inv.paid,
    status: inv.status,
    last: lastLabel(inv.last_payment),
  }
}

export default function Invoices() {
  const live = useLive('invoices')

  const [tab, setTab] = useTabParam('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState('')

  const q = query.trim() || undefined
  const status = tab === 'all' ? undefined : tab

  const { rows, loading, error, next: nextOffset, setRows, sentinelRef } = usePagedList(
    tab === 'debtors' ? null : '/admin/invoices',
    { status, q },
    toRow,
    { delay: 300, live: ['invoices', 'payments'] },
  )

  const { data: counts, reload: reloadCounts } = useApi('/admin/invoices/counts', { q }, { fallback: {}, delay: 300, live: ['invoices', 'payments'] })

  const { data: debtors } = useApi('/admin/dashboard/debtors', { limit: 1000, q }, { fallback: [], delay: 300, live: ['invoices', 'payments'] })

  const now = new Date()

  const due = new Date(now.getFullYear(), now.getMonth() + 1, 10)

  const tabCounts = { ...counts, debtors: debtors.length }

  const totalDebt = debtors.reduce((sum, d) => sum + d.debt, 0)

  function openPay(r) {
    setSelected(r)
    setToast('')
  }

  async function applyPayment({ amount, method, note }) {
    const invoice = selected
    try {
      const payment = await api.post(`/admin/invoices/${invoice.id}/payments`, { amount, method, note })
      setRows((list) => list.map((r) => {
        if (r.id !== invoice.id) return r
        const paid = r.paid + payment.amount
        const status = paid >= r.total ? 'paid' : r.status === 'overdue' ? 'overdue' : 'partial'
        return { ...r, paid, status, last: lastLabel(payment) }
      }))
      reloadCounts()
      setToast(`${invoice.unit} тоотод ${money(payment.amount)} бүртгэгдлээ`)
    } catch (err) {
      setToast(err.message)
    }
    setSelected(null)
  }

  return (
    <div className="invoices">

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

      {tab === 'debtors' ? (
        <Card aria-label="Өр ихтэй тоотууд">
          <p className="inv-debtors-total">
            {debtors.length} тоот · нийт өр <strong>{money(totalDebt)}</strong>
          </p>
          <Table columns={debtorColumns} minWidth={460}>
            {debtors.map((d) => (
              <tr key={d.unit_id}>
                <td className="bold">{d.code}</td>
                <td>{d.entrance}-р орц, {d.floor} давхар</td>
                <td className="num bold">{money(d.debt)}</td>
                <td><Badge tone={d.months >= 2 ? 'red' : 'orange'}>{d.months} сар</Badge></td>
              </tr>
            ))}
          </Table>
          {debtors.length === 0 && <p className="inv-empty">Өртэй тоот алга</p>}
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

          {nextOffset != null && <div ref={sentinelRef} aria-hidden="true" />}
          {!error && !loading && rows.length === 0 && <p className="inv-empty">Тохирох нэхэмжлэл олдсонгүй</p>}
        </Card>
      )}

      {selected && <PayDrawer invoice={selected} onClose={() => setSelected(null)} onSave={applyPayment} />}
    </div>
  )
}
