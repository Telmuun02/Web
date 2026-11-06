import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import Avatar from '../../components/UI/Avatar'
import Button from '../../components/UI/Button'
import Segmented from '../../components/UI/Segmented'
import Switch from '../../components/UI/Switch'
// Backend-тэй түр холбоогүй — бүх өгөгдөл жишээ файлаас
import { fontSizes, sampleFamily, sampleNotifySettings, sampleResident } from '../../samples/resident/profile'
import './styles/Profile.css'

// [{ key: 'pay', on: true }, …] → { pay: true, … }
const initialNotify = Object.fromEntries(sampleNotifySettings.map((s) => [s.key, s.on]))

export default function Profile() {
  const { user, onLogout } = useOutletContext()
  // Түр — тохиргоо хадгалах API нэмэгдэх хүртэл зөвхөн дэлгэц дээр
  const [notify, setNotify] = useState(initialNotify)
  const [fontSize, setFontSize] = useState('m')

  const previewPx = fontSizes.find((f) => f.value === fontSize).px

  return (
    <div className="res-profile-page">
      {/* Тойм */}
      <section className="pf-hero" aria-label="Профайлын тойм">
        <span className="pf-avatar" aria-hidden="true">
          <DarkModeOutlined sx={{ fontSize: 40 }} />
        </span>
        <div className="pf-who">
          <h1>{user.name}</h1>
          <span className="pf-muted">{sampleResident.place}</span>
        </div>
        <div className="pf-tiles">
          <Link to="/pay" className="pf-tile">
            <span className="pf-muted small">Төлбөрийн түүх</span>
            <span className="pf-tile-value">{sampleResident.onTimeMonths} сар цагтаа</span>
          </Link>
          <div className="pf-tile">
            <span className="pf-muted small">Гэр бүлийн гишүүд</span>
            <span className="pf-tile-value">{sampleFamily.length} хүн</span>
          </div>
        </div>
        {/* Түр — профайл засах маягт дараа нэмэгдэнэ */}
        <Button>
          <EditOutlined sx={{ fontSize: 18 }} /> Засах
        </Button>
      </section>

      <div className="pf-columns">
        <div className="pf-col">
          {/* Гэр бүлийн гишүүд */}
          <section className="pf-card" aria-labelledby="fam-title">
            <div className="pf-card-head">
              <h2 id="fam-title">Гэр бүлийн гишүүд</h2>
              {/* Түр — урилга илгээх API нэмэгдэх хүртэл ажиллахгүй */}
              <Button size="small">+ Урих</Button>
            </div>
            {sampleFamily.map((f) => (
              <div key={f.id} className="pf-member">
                <Avatar name={f.name} />
                <span className="pf-member-text">
                  <span className="pf-member-name">{f.name}</span>
                  <span className="pf-muted small">{f.role}</span>
                </span>
                <span className={f.app ? 'pf-app on' : 'pf-app'}>{f.app ? 'Апп-тай' : 'Апп-гүй'}</span>
              </div>
            ))}
          </section>

          {/* Үсгийн хэмжээ */}
          <section className="pf-card" aria-labelledby="size-title">
            <h2 id="size-title">Үсгийн хэмжээ</h2>
            <Segmented label="Үсгийн хэмжээ" options={fontSizes} value={fontSize} onChange={setFontSize} />
            <span className="pf-preview" style={{ fontSize: previewPx }}>Жишээ: 11-р сарын төлбөр 85,000₮</span>
          </section>
        </div>

        <div className="pf-col">
          {/* Хурал ба мэдэгдэл */}
          <section className="pf-card pf-settings" aria-labelledby="set-title">
            <h2 id="set-title">Хурал ба мэдэгдэл</h2>
            {sampleNotifySettings.map((s) => (
              <Switch
                key={s.key}
                label={s.label}
                hint={s.hint}
                checked={notify[s.key]}
                onChange={(on) => setNotify({ ...notify, [s.key]: on })}
              />
            ))}
          </section>

          <button type="button" className="pf-logout" onClick={onLogout}>Гарах</button>
        </div>
      </div>
    </div>
  )
}
