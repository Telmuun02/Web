/**
 * Тайлан — /admin/reports
 * Хаагдсан сарын санхүү: орлого, зарлагын бүтэц, төлөлт орцоор, татаж авах тайлан.
 * GET /api/admin/reports, useLive('reports')
 */

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
import useLive from '../../hooks/useLive'
import useApi from '../../hooks/useApi'
import './styles/Reports.css'

const expenseNames = {
  salary: 'Ажилчдын цалин',
  utilities: 'Нийтийн дулаан, ус',
  elevator: 'Лифтний үйлчилгээ',
  cleaning: 'Цэвэрлэгээ',
  electricity: 'Нийтийн цахилгаан',
  repair: 'Засвар үйлчилгээ',
  other: 'Бусад',
}

function monthLabel(period) {
  const [year, month] = period.split('-')
  return `${year} оны ${Number(month)}-р сар`
}

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

function million(n) {
  return (n / 1000000).toFixed(1)
}

export default function Reports() {
  const live = useLive('reports')
  const { user } = useOutletContext()
  const isAdmin = user.role === 'admin'
  const [shared, setShared] = useState(true)
  const [period, setPeriod] = useState(null)

  const { data: report } = useApi('/admin/reports', { months: 4 }, { fallback: null, live: ['payments', 'invoices', 'expenses', 'requests'] })

  const thisMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
  const closed = (report?.months ?? []).filter((m) => m.period !== thisMonth).reverse()
  const month = closed.find((m) => m.period === period) ?? closed[0]

  const entrances = (report?.entrances ?? [])
    .filter((e) => e.period === month?.period)
    .map((e) => ({
      name: `${e.entrance}-р орц`,
      percent: e.units ? Math.round((e.paid_units / e.units) * 100) : 0,
    }))

  const expenses = (report?.expenses ?? [])
    .filter((x) => x.period === month?.period)
    .map((x) => ({ name: expenseNames[x.category] ?? x.category, amount: x.amount }))
    .sort((a, b) => b.amount - a.amount)
  const total = expenses.reduce((sum, x) => sum + x.amount, 0)

  const largest = expenses[0]

  const stats = [
    month
      ? { label: 'Орлого', value: `${million(month.collected)} сая₮`, note: `Нэхэмжилсний ${month.billed ? Math.round((month.collected / month.billed) * 100) : 0}%` }
      : { label: 'Орлого', value: '—', note: 'Хаагдсан сар алга' },
    month
      ? { label: 'Зарлага', value: `${million(total)} сая₮`, note: `Орлогоос ${million(Math.abs(month.collected - total))} сая₮ ${month.collected >= total ? 'бага' : 'их'}` }
      : { label: 'Зарлага', value: '—' },
    report
      ? { label: 'Нөөц сан', value: `${million(report.reserve.balance)} сая₮`, note: 'Нийт цугласан − нийт зарлага', tone: 'dark' }
      : { label: 'Нөөц сан', value: '—', tone: 'dark' },
    report
      ? { label: 'Хуримтлагдсан өр', value: `${million(report.overdue.debt)} сая₮`, note: `${report.overdue.units} тоот`, tone: 'bad' }
      : { label: 'Хуримтлагдсан өр', value: '—', tone: 'bad' },
  ]

  const docs = sampleDocs.filter((d) => isAdmin || !d.adminOnly)

  return (
    <div className="reports">

      <LiveBar stats={live.stats} events={live.events} />

      <PageHeader sub="Хаагдсан сарын санхүү" title="Тайлан">
        <label className="reports-month">
          <span>Сар</span>
          <select value={month?.period ?? ''} onChange={(e) => setPeriod(e.target.value)}>
            {closed.map((m) => <option key={m.period} value={m.period}>{monthLabel(m.period)}</option>)}
          </select>
        </label>

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
          sub={largest ? `Нийт ${million(total)} сая₮ · хамгийн том нь ${largest.name.toLowerCase()}` : 'Энэ сард зарлага бүртгэгдээгүй'}
          className="reports-expenses"
        >
          {expenses.map((x) => (
            <div key={x.name} className="reports-expense">
              <span>{x.name}</span>
              <ProgressBar value={(x.amount / largest.amount) * 100} size={12} />
              <b>{million(x.amount)} сая</b>
            </div>
          ))}
        </Card>

        <Card title="Төлөлт орцоор" sub={month ? `${Number(month.period.split('-')[1])}-р сарын нэхэмжлэлийн төлөлт` : 'Нэхэмжлэлийн төлөлт'} className="reports-entrances">
          {entrances.length === 0 && <span className="dim">Энэ сард нэхэмжлэл алга</span>}
          {entrances.map((e) => (
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

                <Button size="small">Татах</Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
