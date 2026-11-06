import { useState } from 'react'
import { Link } from 'react-router-dom'
import AddOutlined from '@mui/icons-material/AddOutlined'
import FileUploadOutlined from '@mui/icons-material/FileUploadOutlined'
import Avatar from '../../components/UI/Avatar'
import Badge from '../../components/UI/Badge'
import Button from '../../components/UI/Button'
import Card from '../../components/UI/Card'
import ListItem from '../../components/UI/ListItem'
import PageHeader from '../../components/UI/PageHeader'
import SearchInput from '../../components/UI/SearchInput'
import StatCard from '../../components/UI/StatCard'
import Table from '../../components/UI/Table'
import Tabs from '../../components/UI/Tabs'
import LiveBar from '../../components/admin/LiveBar'
import { liveUnits } from '../../samples/admin/live'
import './styles/Units.css'

// Түр жишээ өгөгдөл — тоот ба оршин суугчийн API нэмэгдэх хүртэл
const sampleStats = [
  { label: 'Оршин суугч', value: 342 },
  { label: 'Апп-д бүртгэлтэй тоот', value: 96, suffix: '/ 120' },
  { label: 'Түрээслэгчтэй тоот', value: 18 },
  { label: 'Хоосон тоот', value: 4 },
]

// fee — сарын хураамж (₮), debt — үлдэгдэл (₮), app — апп-д бүртгэлтэй эсэх
const sampleUnits = [
  {
    unit: '1-03', entrance: '1', area: 62, fee: 85000, debt: 0, app: true,
    people: [
      { name: 'Энхтуяа Б.', role: 'Өмчлөгч', phone: '9911-••03' },
      { name: 'Батсүх Г.', role: 'Гэр бүл', phone: '8810-••41' },
    ],
  },
  {
    unit: '1-05', entrance: '1', area: 68, fee: 92400, debt: 92400, app: true,
    people: [
      { name: 'Оюун Д.', role: 'Өмчлөгч', phone: '9905-••12' },
    ],
  },
  {
    unit: '1-12', entrance: '1', area: 62, fee: 85000, debt: 255000, app: false,
    people: [
      { name: 'Ганболд Т.', role: 'Өмчлөгч', phone: '9912-••77' },
      { name: 'Сүхээ Б.', role: 'Түрээслэгч', phone: '8015-••20' },
    ],
  },
  {
    unit: '1-27', entrance: '1', area: 62, fee: 85000, debt: 0, app: true,
    people: [
      { name: 'Хулан М.', role: 'Өмчлөгч', phone: '9927-••05' },
      { name: 'Мөнх-Од Б.', role: 'Гэр бүл', phone: '9188-••61' },
    ],
  },
  {
    unit: '2-18', entrance: '2', area: 62, fee: 85000, debt: 85000, app: true,
    people: [
      { name: 'Нарантуяа С.', role: 'Өмчлөгч', phone: '9918-••30' },
    ],
  },
  {
    unit: '2-31', entrance: '2', area: 62, fee: 85000, debt: 170000, app: true,
    people: [
      { name: 'Мөнхбат Э.', role: 'Өмчлөгч', phone: '9931-••18' },
      { name: 'Сэлэнгэ Д.', role: 'Гэр бүл', phone: '8831-••44' },
    ],
  },
  {
    unit: '2-45', entrance: '2', area: 62, fee: 85000, debt: 85000, app: true,
    people: [
      { name: 'Болор А.', role: 'Өмчлөгч', phone: '9945-••21' },
      { name: 'Төгөлдөр Б.', role: 'Гэр бүл', phone: '8845-••09' },
      { name: 'Анужин Т.', role: 'Гэр бүл · хүүхэд', phone: '—' },
    ],
  },
  {
    unit: '3-12', entrance: '3', area: 74, fee: 101200, debt: 0, app: false,
    people: [
      { name: 'Даваа Ц.', role: 'Өмчлөгч', phone: '9912-••88' },
    ],
  },
  {
    unit: '3-64', entrance: '3', area: 62, fee: 85000, debt: 45000, app: true,
    people: [
      { name: 'Тэмүүлэн Г.', role: 'Өмчлөгч', phone: '9964-••02' },
      { name: 'Хонгор Н.', role: 'Түрээслэгч', phone: '8064-••73' },
    ],
  },
  {
    unit: '3-87', entrance: '3', area: 62, fee: 85000, debt: 170000, app: true,
    people: [
      { name: 'Сарантуяа Б.', role: 'Өмчлөгч', phone: '9987-••16' },
    ],
  },
]

const tabs = [
  { key: 'all', label: 'Бүгд' },
  { key: '1', label: '1-р орц' },
  { key: '2', label: '2-р орц' },
  { key: '3', label: '3-р орц' },
]

const columns = [
  { label: 'Тоот' },
  { label: 'Өмчлөгч' },
  { label: 'Талбай', align: 'right' },
  { label: 'Гишүүд', align: 'right' },
  { label: 'Апп' },
  { label: 'Үлдэгдэл', align: 'right' },
]

const bigDebt = 170000 // үүнээс их өрийг улаанаар — ойролцоогоор 2 сарын хураамж

// 85000 → '85,000₮'
function money(n) {
  return `${n.toLocaleString('en-US')}₮`
}

function ownerName(u) {
  return u.people.find((p) => p.role === 'Өмчлөгч')?.name ?? '—'
}

function hasTenant(u) {
  return u.people.some((p) => p.role === 'Түрээслэгч')
}

// Хайлт — тоот, гишүүдийн нэр, утсаар
function matches(u, q) {
  const text = [u.unit, ...u.people.map((p) => `${p.name} ${p.phone}`)].join(' ').toLowerCase()
  return text.includes(q)
}

// Үлдэгдлийн өнгө: их өр — улаан, өргүй — ногоон
function debtTone(debt) {
  if (debt >= bigDebt) return 'bad'
  return debt ? '' : 'ok'
}

export default function Units() {
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [selCode, setSelCode] = useState(sampleUnits[0].unit) // баруун талд дэлгэрэнгүйг нь харуулах тоот

  const q = query.trim().toLowerCase()
  const rows = sampleUnits.filter((u) => (tab === 'all' || u.entrance === tab) && (!q || matches(u, q)))
  const sel = sampleUnits.find((u) => u.unit === selCode)

  return (
    <div className="units">
      {/* Шууд мөр — түр жишээ өгөгдөлтэй */}
      <LiveBar {...liveUnits} />

      <PageHeader sub="3 орц · 120 тоот" title="Тоот ба оршин суугч">
        {/* Түр — Excel оруулах, оршин суугч нэмэх API нэмэгдэх хүртэл ажиллахгүй */}
        <Button>
          <FileUploadOutlined sx={{ fontSize: 18 }} /> Excel-ээс оруулах
        </Button>
        <Button variant="primary">
          <AddOutlined sx={{ fontSize: 18 }} /> Оршин суугч нэмэх
        </Button>
      </PageHeader>

      <div className="units-stats">
        {sampleStats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="units-toolbar">
        <Tabs label="Орцоор шүүх" items={tabs} value={tab} onChange={setTab} />
        <SearchInput value={query} onChange={setQuery} placeholder="Тоот, нэр эсвэл утсаар хайх" />
      </div>

      <div className="units-columns">
        <Card className="units-list" aria-label="Тоотын жагсаалт">
          <Table columns={columns} minWidth={620}>
            {rows.map((u) => {
              const selected = u.unit === selCode
              return (
                <tr key={u.unit} className={selected ? 'units-row selected' : 'units-row'}>
                  <td>
                    <button type="button" className="units-code" aria-pressed={selected} onClick={() => setSelCode(u.unit)}>
                      {u.unit}
                    </button>
                  </td>
                  <td>
                    <span className="units-owner">
                      {ownerName(u)}
                      {hasTenant(u) && <Badge small>Түрээслэгчтэй</Badge>}
                    </span>
                  </td>
                  <td className="num dim">{u.area} м²</td>
                  <td className="num">{u.people.length}</td>
                  <td>
                    <span className={u.app ? 'units-app ok' : 'units-app'}>
                      {u.app ? 'Бүртгэлтэй' : 'Урилга хүлээж буй'}
                    </span>
                  </td>
                  <td className={u.debt >= bigDebt ? 'num units-debt bad' : 'num units-debt'}>
                    {u.debt ? money(u.debt) : '—'}
                  </td>
                </tr>
              )
            })}
          </Table>
          {rows.length === 0 && <p className="units-empty">Тохирох тоот олдсонгүй</p>}
        </Card>

        {sel && (
          <Card as="aside" className="units-detail" aria-labelledby="unit-title">
            <div className="units-detail-head">
              <span className="units-muted">
                {sel.entrance}-р орц · {sel.area} м² · сарын хураамж {money(sel.fee)}
              </span>
              <h2 id="unit-title">{sel.unit} тоот</h2>
            </div>

            <div>
              <span className="units-subtitle">Гишүүд</span>
              {sel.people.map((p) => (
                <ListItem key={p.name} icon={<Avatar name={p.name} />} title={p.name} hint={p.role}>
                  <span className="units-phone">{p.phone}</span>
                </ListItem>
              ))}
            </div>

            <div className="units-balance">
              <span className="units-balance-text">
                <span className="units-muted">Үлдэгдэл</span>
                <span className={`units-balance-value ${debtTone(sel.debt)}`}>
                  {sel.debt ? money(sel.debt) : 'Өргүй'}
                </span>
              </span>
              <Link to="/admin/invoices" className="units-link">Нэхэмжлэл харах →</Link>
            </div>

            <div className="units-actions">
              {/* Түр — засах, урилга илгээх API нэмэгдэх хүртэл ажиллахгүй */}
              <Button>Засах</Button>
              <Button variant="dark">Урилга илгээх</Button>
            </div>

            <span className="units-note">Утасны дугаарыг зөвхөн удирдлага бүтнээр харна.</span>
          </Card>
        )}
      </div>
    </div>
  )
}
