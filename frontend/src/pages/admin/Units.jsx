import { useState } from 'react'
import { Link } from 'react-router-dom'
import AddOutlined from '@mui/icons-material/AddOutlined'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import FileUploadOutlined from '@mui/icons-material/FileUploadOutlined'
import Button from '../../components/UI/Button'
import Card from '../../components/UI/Card'
import ListItem from '../../components/UI/ListItem'
import PageHeader from '../../components/UI/PageHeader'
import SearchInput from '../../components/UI/SearchInput'
import StatCard from '../../components/UI/StatCard'
import Table from '../../components/UI/Table'
import Tabs from '../../components/UI/Tabs'
import LiveBar from '../../components/admin/LiveBar'
import api from '../../api/client'
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
  const { data: units, loading, error } = useApi('/admin/units', null, { fallback: [], live: ['units', 'users', 'invoices', 'payments'] })

  // Derived
  const q = query.trim().toLowerCase()
  const rows = units.filter((u) =>
    (tab === 'all' || String(u.entrance) === tab) &&
    (!q || `${u.code} ${u.name ?? ''}`.toLowerCase().includes(q)))
  const sel = rows.find((u) => u.id === selId) ?? rows[0]

  // Сонгосон тоотын гишүүд — /api/admin/units/:id
  const { data: detail, reload: reloadDetail } = useApi(sel ? `/admin/units/${sel.id}` : null, null, { fallback: null, live: ['units', 'users', 'invoices', 'payments'] })
  // Өөрөө бүртгүүлсэн, тоотод холбогдоогүй бүртгэлүүд — шинэ бүртгэл WebSocket-оор шууд нэмэгдэнэ
  const { data: pending, reload: reloadPending } = useApi('/admin/units/pending', null, { fallback: [], live: ['users'] })
  const [linkState, setLinkState] = useState({ error: '', busy: false })

  async function linkRegistration(e, reg) {
    e.preventDefault()
    const unitId = new FormData(e.currentTarget).get('unit')
    setLinkState({ error: '', busy: true })
    try {
      await api.post(`/admin/units/pending/${reg.id}`, { unitId: Number(unitId) })
      setLinkState({ error: '', busy: false })
      reloadPending()
    } catch (err) {
      setLinkState({ error: err.message, busy: false })
    }
  }

  async function rejectRegistration(reg) {
    if (!window.confirm(`${reg.phone} бүртгэлийг устгах уу?`)) return
    setLinkState({ error: '', busy: true })
    try {
      await api.delete(`/admin/units/pending/${reg.id}`)
      setLinkState({ error: '', busy: false })
      reloadPending()
    } catch (err) {
      setLinkState({ error: err.message, busy: false })
    }
  }

  // Утас бүртгэх / хасах — оршин суугч тэр утсаараа /register-ээр баталгаажуулж нэвтэрнэ
  const [phoneState, setPhoneState] = useState({ error: '', busy: false })

  async function addPhone(e) {
    e.preventDefault()
    const form = e.currentTarget
    const phone = new FormData(form).get('phone')
    setPhoneState({ error: '', busy: true })
    try {
      await api.post(`/admin/units/${sel.id}/phones`, { phone })
      form.reset()
      setPhoneState({ error: '', busy: false })
      reloadDetail()
    } catch (err) {
      setPhoneState({ error: err.message, busy: false })
    }
  }

  async function removePhone(p) {
    if (!window.confirm(`${p.phone} дугаарыг ${sel.code} тоотоос хасах уу? Энэ утсаар нэвтрэх боломжгүй болно.`)) return
    setPhoneState({ error: '', busy: true })
    try {
      await api.delete(`/admin/units/${sel.id}/phones/${p.id}`)
      setPhoneState({ error: '', busy: false })
      reloadDetail()
    } catch (err) {
      setPhoneState({ error: err.message, busy: false })
    }
  }
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
      </PageHeader>

      {/* Өөрөө бүртгүүлсэн, тоотод холбогдоогүй бүртгэл — холбосны дараа оршин суугч нэвтэрнэ */}
      {pending.length > 0 && (
        <Card as="section" className="units-pending" aria-labelledby="pending-title">
          <h2 id="pending-title">Холбогдоогүй бүртгэл · {pending.length}</h2>
          <span className="units-muted">Утсаараа бүртгүүлсэн хүмүүс. Тоотыг нь шалгаад холбоно уу, танихгүй бол устгана.</span>
          {pending.map((reg) => (
            <form key={reg.id} className="units-pending-row" onSubmit={(e) => linkRegistration(e, reg)}>
              <span className="units-pending-phone">
                <strong>{reg.phone}</strong>
                <span className="units-muted">{new Date(reg.created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </span>
              <label className="visually-hidden" htmlFor={`unit-${reg.id}`}>{reg.phone} дугаарыг холбох тоот</label>
              <select id={`unit-${reg.id}`} name="unit" required defaultValue="">
                <option value="" disabled>Тоот сонгох…</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}
              </select>
              <Button type="submit" variant="dark" disabled={linkState.busy}>Холбох</Button>
              <Button type="button" variant="danger" disabled={linkState.busy} onClick={() => rejectRegistration(reg)}>Устгах</Button>
            </form>
          ))}
          {linkState.error && <p className="units-phone-error" role="alert">{linkState.error}</p>}
        </Card>
      )}

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
              <span className="units-subtitle">Бүртгэлтэй утас · {people.length}</span>
              {people.map((p) => (
                <ListItem
                  key={p.id}
                  title={p.phone}
                  hint={p.activated ? 'Идэвхжсэн — апп-д нэвтэрдэг' : 'Хүлээгдэж байна — утсаараа бүртгүүлээгүй'}
                >
                  <button type="button" className="units-phone-remove" aria-label={`${p.phone} дугаарыг хасах`} onClick={() => removePhone(p)} disabled={phoneState.busy}>
                    <CloseOutlined sx={{ fontSize: 18 }} />
                  </button>
                </ListItem>
              ))}
              {people.length === 0 && <p className="units-muted">Утас бүртгээгүй — оршин суугч нэвтэрч чадахгүй</p>}

              {/* Шинэ утас — оршин суугч энэ дугаараараа "Бүртгүүлэх"-ээр SMS баталгаажуулна */}
              <form className="units-phone-add" onSubmit={addPhone}>
                <label className="visually-hidden" htmlFor="new-phone">Шинэ утасны дугаар</label>
                <input id="new-phone" name="phone" inputMode="tel" placeholder="99112233" maxLength={15} required />
                <Button type="submit" variant="dark" disabled={phoneState.busy}>
                  <AddOutlined sx={{ fontSize: 18 }} /> Утас нэмэх
                </Button>
              </form>
              {phoneState.error && <p className="units-phone-error" role="alert">{phoneState.error}</p>}
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

            <span className="units-note">Нэг тоот — нэг бүртгэл. Бүртгэсэн утас бүрээр оршин суугч 144773 руу SMS илгээж баталгаажуулаад нэвтэрнэ.</span>
          </Card>
        )}
      </div>
    </div>
  )
}
