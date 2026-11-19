import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import Avatar from '../../components/UI/Avatar'
import Button from '../../components/UI/Button'
import Segmented from '../../components/UI/Segmented'
import Switch from '../../components/UI/Switch'
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
  const { user, onLogout } = useOutletContext()
  // GET /api/resident/profile — тоот, нэг тоотод бүртгэлтэй гишүүд, цагтаа төлсөн сар
  const { data, error } = useApi('/resident/profile', null, { fallback: null })
  // Бүх тохиргоо нэг object-д: мэдэгдлийн унтраалгууд + үсгийн хэмжээ
  const [prefs, setPrefs] = useState({ ...initialNotify, fontSize: 'm' })

  // Нэг тохиргоог солино: set('pay')(false), set('fontSize')('l')
  const set = (key) => (value) => setPrefs((p) => ({ ...p, [key]: value }))

  const previewPx = fontSizes.find((f) => f.value === prefs.fontSize).px
  const family = data?.family ?? []
  const place = data?.unit ? `${data.unit.entrance}-р орц · ${data.unit.code} тоот` : 'Тоот бүртгэгдээгүй'

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
            <span className="pf-muted small">Тоотын гишүүд</span>
            <span className="pf-tile-value">{data ? `${family.length} хүн` : '—'}</span>
          </div>
        </div>
        {/* Түр — профайл засах маягт дараа нэмэгдэнэ (PUT /api/profile бэлэн) */}
        <Button>
          <EditOutlined sx={{ fontSize: 18 }} /> Засах
        </Button>
      </section>

      <div className="pf-columns">
        <div className="pf-col">
          {/* Нэг тоотод бүртгэлтэй гишүүд */}
          <section className="pf-card" aria-labelledby="fam-title">
            <div className="pf-card-head">
              <h2 id="fam-title">Тоотын гишүүд</h2>
            </div>
            {data && family.length === 0 && <span className="pf-muted small">Бүртгэлтэй гишүүн алга</span>}
            {family.map((f) => (
              <div key={f.id} className="pf-member">
                <Avatar name={f.name} />
                <span className="pf-member-text">
                  <span className="pf-member-name">{f.name}</span>
                  <span className="pf-muted small">{f.me ? 'Та' : 'Гишүүн'}</span>
                </span>
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
