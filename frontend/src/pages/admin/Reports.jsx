import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined'
import Badge from '../../components/UI/Badge'
import Button from '../../components/UI/Button'
import Card from '../../components/UI/Card'
import PageHeader from '../../components/UI/PageHeader'
import ProgressBar from '../../components/UI/ProgressBar'
import StatCard from '../../components/UI/StatCard'
import Switch from '../../components/UI/Switch'
import Table from '../../components/UI/Table'
import LiveBar from '../../components/admin/LiveBar'
import useApi from '../../hooks/useApi'
import { liveReports } from '../../samples/admin/live'
import './styles/Reports.css'

// Түр жишээ — зарлага, нөөц сангийн өгөгдөл DB-д одоохондоо алга
const sampleExpenseStats = [
  { label: 'Зарлага', value: '8.4 сая₮', note: 'Төсвөөс 0.2 сая₮ бага' },
  { label: 'Нөөц сан', value: '14.2 сая₮', note: 'Энэ сард +1.2 сая₮', tone: 'dark' },
]

// '2026-10-01' → '2026 оны 10-р сар'
function monthLabel(period) {
  const [year, month] = period.split('-')
  return `${year} оны ${Number(month)}-р сар`
}

// Зарлага ангиллаар (₮) — түр жишээ
const sampleExpenses = [
  { name: 'Ажилчдын цалин', amount: 3200000 },
  { name: 'Нийтийн дулаан, ус', amount: 1900000 },
  { name: 'Лифтний үйлчилгээ', amount: 1100000 },
  { name: 'Цэвэрлэгээ', amount: 900000 },
  { name: 'Нийтийн цахилгаан', amount: 700000 },
  { name: 'Бусад', amount: 600000 },
]

// Орц бүрийн төлөлтийн хувь — түр жишээ
const sampleEntrances = [
  { name: '1-р орц', percent: 82 },
  { name: '2-р орц', percent: 77 },
  { name: '3-р орц', percent: 72 },
]

// adminOnly — оршин суугчид харагдахгүй
const sampleDocs = [
  { name: 'Сарын санхүүгийн тайлан', hint: 'Орлого, зарлага, нөөц сан', period: '10-р сар', format: 'PDF' },
  { name: 'Төлбөрийн бүртгэл', hint: 'Тоот бүрийн гүйлгээ', period: '10-р сар', format: 'Excel' },
  { name: 'Өрийн жагсаалт', hint: 'Хугацаа хэтэрсэн тоотууд', period: '11/14 байдлаар', format: 'Excel' },
  { name: 'Засварын хүсэлтийн тайлан', hint: 'Ангилал, шийдсэн хугацаа', period: '10-р сар', format: 'PDF' },
  { name: 'Аудит лог', hint: 'Ажилтны бүх үйлдэл', period: '10-р сар', format: 'CSV', adminOnly: true },
]

const columns = [
  { label: 'Тайлан' },
  { label: 'Хамрах хугацаа' },
  { label: 'Формат' },
  { label: 'Үйлдэл', align: 'right' },
]

// 3200000 → '3.2'
function million(n) {
  return (n / 1000000).toFixed(1)
}

export default function Reports() {
  const { user } = useOutletContext()
  const isAdmin = user.role === 'admin'
  const [shared, setShared] = useState(true) // тайланг оршин суугчдад нийтлэх эсэх
  const [period, setPeriod] = useState(null) // сонгосон сар, null бол хамгийн сүүлийн хаагдсан сар

  // ---------- Server state ----------
  // Сүүлийн 4 сар — явагдаж буй сар + хаагдсан 3 сар
  const { data: report } = useApi('/admin/reports', { months: 4 }, { fallback: null })

  // Derived — зөвхөн хаагдсан саруудыг сонгоно (явагдаж буй сар дуусаагүй), шинээс нь
  const thisMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
  const closed = (report?.months ?? []).filter((m) => m.period !== thisMonth).reverse()
  const month = closed.find((m) => m.period === period) ?? closed[0]

  const stats = [
    month
      ? { label: 'Орлого', value: `${million(month.collected)} сая₮`, note: `Нэхэмжилсний ${month.billed ? Math.round((month.collected / month.billed) * 100) : 0}%` }
      : { label: 'Орлого', value: '—', note: 'Хаагдсан сар алга' },
    ...sampleExpenseStats,
    report
      ? { label: 'Хуримтлагдсан өр', value: `${million(report.overdue.debt)} сая₮`, note: `${report.overdue.units} тоот`, tone: 'bad' }
      : { label: 'Хуримтлагдсан өр', value: '—', tone: 'bad' },
  ]

  const total = sampleExpenses.reduce((sum, x) => sum + x.amount, 0)
  // Хамгийн том зарлага — зурвасын уртыг үүнтэй харьцуулна (= 100%)
  const largest = sampleExpenses.reduce((a, b) => (b.amount > a.amount ? b : a))
  const docs = sampleDocs.filter((d) => isAdmin || !d.adminOnly)

  return (
    <div className="reports">
      {/* Шууд мөр — түр жишээ өгөгдөлтэй */}
      <LiveBar {...liveReports} />

      <PageHeader sub="Хаагдсан сарын санхүү" title="Тайлан">
        <label className="reports-month">
          <span>Сар</span>
          <select value={month?.period ?? ''} onChange={(e) => setPeriod(e.target.value)}>
            {closed.map((m) => <option key={m.period} value={m.period}>{monthLabel(m.period)}</option>)}
          </select>
        </label>
        {/* Түр — PDF үүсгэх API нэмэгдэх хүртэл ажиллахгүй */}
        <Button variant="dark">
          <FileDownloadOutlined sx={{ fontSize: 18 }} /> PDF татах
        </Button>
      </PageHeader>

      <div className="reports-stats">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="reports-columns">
        <Card
          title="Зарлагын бүтэц"
          sub={`Нийт ${million(total)} сая₮ · хамгийн том нь ${largest.name.toLowerCase()}`}
          className="reports-expenses"
        >
          {sampleExpenses.map((x) => (
            <div key={x.name} className="reports-expense">
              <span>{x.name}</span>
              <ProgressBar value={(x.amount / largest.amount) * 100} size={12} />
              <b>{million(x.amount)} сая</b>
            </div>
          ))}
        </Card>

        <Card title="Төлөлт орцоор" sub={month ? `${Number(month.period.split('-')[1])}-р сарын нэхэмжлэлийн төлөлт` : 'Нэхэмжлэлийн төлөлт'} className="reports-entrances">
          {sampleEntrances.map((e) => (
            <div key={e.name} className="reports-entrance">
              <div className="reports-entrance-head">
                <span>{e.name}</span>
                <b>{e.percent}%</b>
              </div>
              <ProgressBar value={e.percent} color="var(--yellow)" size={12} />
            </div>
          ))}

          {isAdmin && (
            <Switch
              label="Оршин суугчдад нийтлэх"
              hint={shared ? 'Апп-ын Зарлал хэсэгт товчоор харагдана' : 'Зөвхөн ажилтнууд харна'}
              checked={shared}
              onChange={setShared}
            />
          )}
        </Card>
      </div>

      <Card title="Татаж авах тайлан">
        <Table columns={columns} minWidth={600}>
          {docs.map((d) => (
            <tr key={d.name}>
              <td>
                <span className="reports-doc">
                  <b>{d.name}</b>
                  <span>{d.hint}</span>
                </span>
              </td>
              <td className="dim">{d.period}</td>
              <td><Badge>{d.format}</Badge></td>
              <td className="num">
                {/* Түр — татах API нэмэгдэх хүртэл ажиллахгүй */}
                <Button size="small">Татах</Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
