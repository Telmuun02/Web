'use client'

import { useState } from 'react'
import { useAppContext } from '../components/App/AppShell'
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined'
import Badge from '../components/UI/Badge'
import Button from '../components/UI/Button'
import Card from '../components/UI/Card'
import PageHeader from '../components/UI/PageHeader'
import ProgressBar from '../components/UI/ProgressBar'
import StatCard from '../components/UI/StatCard'
import Switch from '../components/UI/Switch'
import Table from '../components/UI/Table'
import './styles/Reports.css'

// Түр жишээ өгөгдөл — тайлангийн API нэмэгдэх хүртэл
const months = ['2026 оны 10-р сар', '2026 оны 9-р сар', '2026 оны 8-р сар']

const sampleStats = [
  { label: 'Орлого', value: '9.6 сая₮', note: 'Нэхэмжилсний 94%' },
  { label: 'Зарлага', value: '8.4 сая₮', note: 'Төсвөөс 0.2 сая₮ бага' },
  { label: 'Нөөц сан', value: '14.2 сая₮', note: 'Энэ сард +1.2 сая₮', tone: 'dark' },
  { label: 'Хуримтлагдсан өр', value: '1.3 сая₮', note: '14 тоот', tone: 'bad' },
]

// Зарлага ангиллаар (₮)
const sampleExpenses = [
  { name: 'Ажилчдын цалин', amount: 3200000 },
  { name: 'Нийтийн дулаан, ус', amount: 1900000 },
  { name: 'Лифтний үйлчилгээ', amount: 1100000 },
  { name: 'Цэвэрлэгээ', amount: 900000 },
  { name: 'Нийтийн цахилгаан', amount: 700000 },
  { name: 'Бусад', amount: 600000 },
]

// Орц бүрийн төлөлтийн хувь
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
  const { user } = useAppContext()
  const isAdmin = user.role === 'admin'
  const [shared, setShared] = useState(true) // тайланг оршин суугчдад нийтлэх эсэх

  const total = sampleExpenses.reduce((sum, x) => sum + x.amount, 0)
  // Хамгийн том зарлага — зурвасын уртыг үүнтэй харьцуулна (= 100%)
  const largest = sampleExpenses.reduce((a, b) => (b.amount > a.amount ? b : a))
  const docs = sampleDocs.filter((d) => isAdmin || !d.adminOnly)

  return (
    <div className="reports">
      <PageHeader sub="Хаагдсан сарын санхүү" title="Тайлан">
        <label className="reports-month">
          <span>Сар</span>
          <select>
            {months.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        {/* Түр — PDF үүсгэх API нэмэгдэх хүртэл ажиллахгүй */}
        <Button variant="dark">
          <FileDownloadOutlined sx={{ fontSize: 18 }} /> PDF татах
        </Button>
      </PageHeader>

      <div className="reports-stats">
        {sampleStats.map((s) => <StatCard key={s.label} {...s} />)}
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

        <Card title="Төлөлт орцоор" sub="10-р сарын нэхэмжлэлийн төлөлт" className="reports-entrances">
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
