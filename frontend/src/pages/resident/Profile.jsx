/**
 * Профайл — /profile
 * Тоот, бүртгэлтэй утаснууд, цагтаа төлсөн сар, мэдэгдлийн тохиргоо, үсгийн хэмжээ, нууц үг солих.
 * Мэдэгдлийн тохиргоо DB-д хадгалагдахгүй (хүснэгт алга), зөвхөн дэлгэц дээр.
 * GET /api/resident/profile
 */

import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import LockResetOutlined from '@mui/icons-material/LockResetOutlined'
import PhoneIphoneOutlined from '@mui/icons-material/PhoneIphoneOutlined'
import Button from '../../components/UI/Button'
import Segmented from '../../components/UI/Segmented'
import Switch from '../../components/UI/Switch'
import useApi from '../../hooks/useApi'
import './styles/Profile.css'

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

const initialNotify = Object.fromEntries(notifySettings.map((s) => [s.key, s.on]))

export default function Profile() {
  const { user, onLogout } = useOutletContext()

  const { data, error } = useApi('/resident/profile', null, { fallback: null, live: ['users', 'payments', 'invoices'] })

  const [prefs, setPrefs] = useState({ ...initialNotify, fontSize: 'm' })

  const set = (key) => (value) => setPrefs((p) => ({ ...p, [key]: value }))

  const previewPx = fontSizes.find((f) => f.value === prefs.fontSize).px
  const phones = data?.family ?? []
  const place = data?.unit ? `${data.unit.entrance}-р орц · ${data.unit.code} тоот` : 'Тоот бүртгэгдээгүй'

  return (
    <div className="res-profile-page">
      {error && <p role="alert">{error}</p>}

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
            <span className="pf-muted small">Бүртгэлтэй утас</span>
            <span className="pf-tile-value">{data ? `${phones.length} утас` : '—'}</span>
          </div>
        </div>

        <Button as={Link} to="/forgot-password" state={{ login: user.phone ?? '' }}>
          <LockResetOutlined sx={{ fontSize: 18 }} /> Нууц үг солих
        </Button>
      </section>

      <div className="pf-columns">
        <div className="pf-col">

          <section className="pf-card" aria-labelledby="fam-title">
            <div className="pf-card-head">
              <h2 id="fam-title">Бүртгэлтэй утас</h2>
            </div>
            {data && phones.length === 0 && <span className="pf-muted small">Бүртгэлтэй утас алга</span>}
            {phones.map((f) => (
              <div key={f.id} className="pf-member">
                <span className="pf-phone-icon" aria-hidden="true"><PhoneIphoneOutlined sx={{ fontSize: 20 }} /></span>
                <span className="pf-member-text">
                  <span className="pf-member-name">{f.phone}</span>
                  <span className="pf-muted small">{f.me ? 'Та энэ утсаар нэвтэрсэн' : 'Гэр бүлийн гишүүн'}</span>
                </span>
                <span className={f.app ? 'pf-app on' : 'pf-app'}>{f.app ? 'Идэвхжсэн' : 'Бүртгүүлээгүй'}</span>
              </div>
            ))}
            <span className="pf-muted small">Утас нэмэх, хасах бол СӨХ-д хандана уу.</span>
          </section>

          <section className="pf-card" aria-labelledby="size-title">
            <h2 id="size-title">Үсгийн хэмжээ</h2>
            <Segmented label="Үсгийн хэмжээ" options={fontSizes} value={prefs.fontSize} onChange={set('fontSize')} />
            <span className="pf-preview" style={{ fontSize: previewPx }}>Жишээ: 11-р сарын төлбөр 85,000₮</span>
          </section>
        </div>

        <div className="pf-col">

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
