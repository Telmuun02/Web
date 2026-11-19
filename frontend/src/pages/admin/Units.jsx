import { useState } from 'react'
import { Link } from 'react-router-dom'
import AddOutlined from '@mui/icons-material/AddOutlined'
import FileUploadOutlined from '@mui/icons-material/FileUploadOutlined'
import Avatar from '../../components/UI/Avatar'
import Button from '../../components/UI/Button'
import Card from '../../components/UI/Card'
import ListItem from '../../components/UI/ListItem'
import PageHeader from '../../components/UI/PageHeader'
import SearchInput from '../../components/UI/SearchInput'
import StatCard from '../../components/UI/StatCard'
import Table from '../../components/UI/Table'
import Tabs from '../../components/UI/Tabs'
import LiveBar from '../../components/admin/LiveBar'
import useApi from '../../hooks/useApi'
import useLive from '../../hooks/useLive'
import useTabParam from '../../hooks/useTabParam'
import './styles/Units.css'

const tabs = [
  { key: 'all', label: 'Бүгд' },
  { key: '1', label: '1-р орц' },
  { key: '2', label: '2-р орц' },
  { key: '3', label: '3-р орц' },
]

const columns = [
  { label: 'Тоот' },
  { label: 'Оршин суугч' },
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

// '9911 2203' → '9911-••03' — утасны дугаарыг бүтнээр нь харуулахгүй
function maskPhone(phone) {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  return digits.length < 6 ? phone : `${digits.slice(0, 4)}-••${digits.slice(-2)}`
}

// Үлдэгдлийн өнгө: их өр — улаан, өргүй — ногоон
function debtTone(debt) {
  if (debt >= bigDebt) return 'bad'
  return debt ? '' : 'ok'
}

export default function Units() {
  const live = useLive('units') // "ШУУД" мөр — /api/admin/live/units
  const [tab, setTab] = useTabParam('all') // /admin/units?tab=2
  const [query, setQuery] = useState('')
  const [selId, setSelId] = useState(null) // баруун талд дэлгэрэнгүйг нь харуулах тоот

  // ---------- Server state ----------
  // Бүх тоотыг нэг удаа татаад (120 орчим) таб, хайлтыг энд шүүнэ — статистик бүх тоотоос бодогдоно
  const { data: units, loading, error } = useApi('/admin/units', null, { fallback: [] })

  // Derived
  const q = query.trim().toLowerCase()
  const rows = units.filter((u) =>
    (tab === 'all' || String(u.entrance) === tab) &&
    (!q || `${u.code} ${u.name ?? ''}`.toLowerCase().includes(q)))
  const sel = rows.find((u) => u.id === selId) ?? rows[0]

  // Сонгосон тоотын гишүүд — /api/admin/units/:id
  const { data: detail } = useApi(sel ? `/admin/units/${sel.id}` : null, null, { fallback: null })
  const people = detail?.id === sel?.id ? detail.residents : []

  const residents = units.reduce((sum, u) => sum + u.residents, 0)
  const withApp = units.filter((u) => u.residents > 0).length
  const stats = [
    { label: 'Оршин суугч', value: residents },
    { label: 'Апп-д бүртгэлтэй тоот', value: withApp, suffix: `/ ${units.length}` },
    { label: 'Өртэй тоот', value: units.filter((u) => u.debt > 0).length },
    { label: 'Хоосон тоот', value: units.length - withApp },
  ]
  const entrances = new Set(units.map((u) => u.entrance)).size

  return (
    <div className="units">
      <LiveBar stats={live.stats} events={live.events} />

      <PageHeader sub={`${entrances} орц · ${units.length} тоот`} title="Тоот ба оршин суугч">
        {/* Түр — Excel оруулах, оршин суугч нэмэх API нэмэгдэх хүртэл ажиллахгүй */}
        <Button>
          <FileUploadOutlined sx={{ fontSize: 18 }} /> Excel-ээс оруулах
        </Button>
        <Button variant="primary">
          <AddOutlined sx={{ fontSize: 18 }} /> Оршин суугч нэмэх
        </Button>
      </PageHeader>

      <div className="units-stats">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="units-toolbar">
        <Tabs label="Орцоор шүүх" items={tabs} value={tab} onChange={setTab} />
        <SearchInput value={query} onChange={setQuery} placeholder="Тоот эсвэл нэрээр хайх" />
      </div>

      <div className="units-columns">
        <Card className="units-list" aria-label="Тоотын жагсаалт">
          <Table columns={columns} minWidth={620}>
            {rows.map((u) => {
              const selected = u.id === sel?.id
              return (
                <tr key={u.id} className={selected ? 'units-row selected' : 'units-row'}>
                  <td>
                    <button type="button" className="units-code" aria-pressed={selected} onClick={() => setSelId(u.id)}>
                      {u.code}
                    </button>
                  </td>
                  <td><span className="units-owner">{u.name ?? '—'}</span></td>
                  <td className="num dim">{u.area_m2 ? `${Number(u.area_m2)} м²` : '—'}</td>
                  <td className="num">{u.residents}</td>
                  <td>
                    <span className={u.residents ? 'units-app ok' : 'units-app'}>
                      {u.residents ? 'Бүртгэлтэй' : 'Урилга хүлээж буй'}
                    </span>
                  </td>
                  <td className={u.debt >= bigDebt ? 'num units-debt bad' : 'num units-debt'}>
                    {u.debt ? money(u.debt) : '—'}
                  </td>
                </tr>
              )
            })}
          </Table>
          {error && <p className="units-empty">{error}</p>}
          {!error && loading && <p className="units-empty">Ачааллаж байна…</p>}
          {!error && !loading && rows.length === 0 && <p className="units-empty">Тохирох тоот олдсонгүй</p>}
        </Card>

        {sel && (
          <Card as="aside" className="units-detail" aria-labelledby="unit-title">
            <div className="units-detail-head">
              <span className="units-muted">
                {sel.entrance}-р орц · {sel.floor ? `${sel.floor} давхар · ` : ''}{sel.area_m2 ? `${Number(sel.area_m2)} м²` : ''}
              </span>
              <h2 id="unit-title">{sel.code} тоот</h2>
            </div>

            <div>
              <span className="units-subtitle">Гишүүд</span>
              {people.map((p) => (
                <ListItem key={p.id} icon={<Avatar name={p.name} />} title={p.name} hint="Оршин суугч">
                  <span className="units-phone">{maskPhone(p.phone)}</span>
                </ListItem>
              ))}
              {people.length === 0 && <p className="units-muted">Бүртгэлтэй оршин суугч алга</p>}
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
