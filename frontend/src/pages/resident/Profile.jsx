import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import Avatar from '../../components/UI/Avatar'
import Button from '../../components/UI/Button'
import Field from '../../components/UI/Field'
import Segmented from '../../components/UI/Segmented'
import Switch from '../../components/UI/Switch'
import Toast from '../../components/UI/Toast'
import api from '../../api/client'
import useApi from '../../hooks/useApi'
import './styles/Profile.css'

// Мэдэгдлийн тохиргоо — on: анхдагч утга. DB-д хадгалах хүснэгт алга тул одоогоор зөвхөн дэлгэц дээр
const notifySettings = [
  { key: 'avatar', label: 'Хуралд аватартай орох', hint: 'Нүүр тань анхдагчаар нууцлагдана', on: true },
  { key: 'pay', label: 'Төлбөрийн сануулга', hint: 'Хугацаанаас 3 хоногийн өмнө · SMS', on: true },
  { key: 'meeting', label: 'Хурлын сануулга', hint: '1 цагийн өмнө · апп ба имэйл', on: true },
  { key: 'news', label: 'Шинэ зарлал', hint: 'Чухал зарлал үргэлж ирнэ', on: false },
]

const fontSizes = [
  { value: 's', label: 'Жижиг', px: 14 },
  { value: 'm', label: 'Дунд', px: 16 },
  { value: 'l', label: 'Том', px: 19 },
]

// [{ key: 'pay', on: true }, …] → { pay: true, … }
const initialNotify = Object.fromEntries(notifySettings.map((s) => [s.key, s.on]))

export default function Profile() {
  const { user, onLogout, onUserChange } = useOutletContext()
  // "Засах" — нэр, утас, имэйл. Хадгалахдаа одоогийн нууц үгээр баталгаажуулна (PUT /api/profile)
  const [editing, setEditing] = useState(false)
  const [saveState, setSaveState] = useState({ error: '', toast: '', saving: false })
  // GET /api/resident/profile — тоот, нэг тоотод бүртгэлтэй гишүүд, цагтаа төлсөн сар
  const { data, error } = useApi('/resident/profile', null, { fallback: null, live: ['users', 'payments', 'invoices'] })
  // Бүх тохиргоо нэг object-д: мэдэгдлийн унтраалгууд + үсгийн хэмжээ
  const [prefs, setPrefs] = useState({ ...initialNotify, fontSize: 'm' })

  // Нэг тохиргоог солино: set('pay')(false), set('fontSize')('l')
  const set = (key) => (value) => setPrefs((p) => ({ ...p, [key]: value }))

  const previewPx = fontSizes.find((f) => f.value === prefs.fontSize).px
  const family = data?.family ?? []
  const place = data?.unit ? `${data.unit.entrance}-р орц · ${data.unit.code} тоот` : 'Тоот бүртгэгдээгүй'

  async function saveProfile(e) {
    e.preventDefault()
    const form = Object.fromEntries(new FormData(e.currentTarget))
    setSaveState({ error: '', toast: '', saving: true })
    try {
      const updated = await api.put('/profile', form)
      onUserChange?.({ ...user, ...updated })
      setEditing(false)
      setSaveState({ error: '', toast: 'Хувийн мэдээлэл хадгалагдлаа', saving: false })
    } catch (err) {
      setSaveState({ error: err.message, toast: '', saving: false })
    }
  }

  return (
    <div className="res-profile-page">
      {error && <p role="alert">{error}</p>}

      {/* Тойм */}
      <section className="pf-hero" aria-label="Профайлын тойм">
        <span className="pf-avatar" aria-hidden="true">
          <DarkModeOutlined sx={{ fontSize: 40 }} />
        </span>
        <div className="pf-who">
          <h1>{user.name}</h1>
          <span className="pf-muted">{data ? place : 'Ачааллаж байна…'}</span>
        </div>
        <div className="pf-tiles">
          <Link to="/pay" className="pf-tile">
            <span className="pf-muted small">Сүүлийн 12 сард</span>
            <span className="pf-tile-value">{data?.on_time_months ?? '—'} сар цагтаа</span>
          </Link>
          <div className="pf-tile">
            <span className="pf-muted small">Гэр бүлийн гишүүд</span>
            <span className="pf-tile-value">{data ? `${family.length} хүн` : '—'}</span>
          </div>
        </div>
        <Button onClick={() => setEditing((e) => !e)} aria-expanded={editing}>
          <EditOutlined sx={{ fontSize: 18 }} /> {editing ? 'Болих' : 'Засах'}
        </Button>
      </section>

      <Toast>{saveState.toast}</Toast>

      {/* Хувийн мэдээлэл засах — утас эсвэл имэйлийн аль нэг заавал */}
      {editing && (
        <form className="pf-card pf-edit" onSubmit={saveProfile} aria-labelledby="edit-title">
          <h2 id="edit-title">Хувийн мэдээлэл</h2>
          <div className="pf-edit-grid">
            <Field label="Нэр"><input name="name" defaultValue={user.name ?? ''} required maxLength={100} /></Field>
            <Field label="Утас"><input name="phone" defaultValue={user.phone ?? ''} inputMode="tel" maxLength={20} /></Field>
            <Field label="Имэйл"><input name="email" type="email" defaultValue={user.email ?? ''} maxLength={150} /></Field>
            <Field label="Одоогийн нууц үг"><input name="password" type="password" required autoComplete="current-password" /></Field>
          </div>
          {saveState.error && <p className="pf-error" role="alert">{saveState.error}</p>}
          <div className="pf-edit-actions">
            <Button type="submit" variant="primary" disabled={saveState.saving}>{saveState.saving ? 'Хадгалж байна…' : 'Хадгалах'}</Button>
            <Button type="button" onClick={() => setEditing(false)}>Болих</Button>
          </div>
        </form>
      )}

      <div className="pf-columns">
        <div className="pf-col">
          {/* Нэг тоотод бүртгэлтэй гишүүд */}
          <section className="pf-card" aria-labelledby="fam-title">
            <div className="pf-card-head">
              <h2 id="fam-title">Гэр бүлийн гишүүд</h2>
            </div>
            {data && family.length === 0 && <span className="pf-muted small">Бүртгэлтэй гишүүн алга</span>}
            {family.map((f) => (
              <div key={f.id} className="pf-member">
                <Avatar name={f.name} />
                <span className="pf-member-text">
                  <span className="pf-member-name">{f.name}</span>
                  <span className="pf-muted small">{f.me ? 'Та' : 'Гэр бүл'}</span>
                </span>
                <span className={f.app ? 'pf-app on' : 'pf-app'}>{f.app ? 'Апп-тай' : 'Апп-гүй'}</span>
              </div>
            ))}
          </section>

          {/* Үсгийн хэмжээ */}
          <section className="pf-card" aria-labelledby="size-title">
            <h2 id="size-title">Үсгийн хэмжээ</h2>
            <Segmented label="Үсгийн хэмжээ" options={fontSizes} value={prefs.fontSize} onChange={set('fontSize')} />
            <span className="pf-preview" style={{ fontSize: previewPx }}>Жишээ: 11-р сарын төлбөр 85,000₮</span>
          </section>
        </div>

        <div className="pf-col">
          {/* Хурал ба мэдэгдэл */}
          <section className="pf-card pf-settings" aria-labelledby="set-title">
            <h2 id="set-title">Хурал ба мэдэгдэл</h2>
            {notifySettings.map((s) => (
              <Switch
                key={s.key}
                label={s.label}
                hint={s.hint}
                checked={prefs[s.key]}
                onChange={set(s.key)}
              />
            ))}
          </section>

          <button type="button" className="pf-logout" onClick={onLogout}>Гарах</button>
        </div>
      </div>
    </div>
  )
}
