import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import CheckOutlined from '@mui/icons-material/CheckOutlined'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import ComputerOutlined from '@mui/icons-material/ComputerOutlined'
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined'
import SmartphoneOutlined from '@mui/icons-material/SmartphoneOutlined'
import './styles/Profile.css'

// Түр жишээ өгөгдөл — backend бэлэн болоход солигдоно
const sampleStats = [
  { value: 186, label: 'Энэ сард бүртгэсэн төлбөр' },
  { value: 120, label: 'Гаргасан нэхэмжлэл' },
  { value: 14, label: 'Илгээсэн сануулга' },
]

const sampleSessions = [
  { id: 1, name: 'Chrome · Windows', where: 'Улаанбаатар · одоо идэвхтэй', current: true, phone: false },
  { id: 2, name: 'СӨХ Hub апп · iPhone', where: 'Улаанбаатар · 2 цагийн өмнө', current: false, phone: true },
  { id: 3, name: 'Edge · Windows', where: 'СӨХ-ийн оффис · 3 хоногийн өмнө', current: false, phone: false },
]

const sampleActivity = [
  { text: '3-24 тоотод 40,000₮ бэлэн төлбөр бүртгэсэн', time: 'Өнөөдөр 10:42' },
  { text: '13 өртэй тоотод SMS сануулга илгээсэн', time: 'Өчигдөр 17:05' },
  { text: '«10-р сарын нэхэмжлэл гарлаа» зарлал нийтэлсэн', time: '10/01 09:12' },
  { text: '9-р сарын санхүүгийн тайлан татсан', time: '10/01 08:40' },
]

const notificationItems = [
  { key: 'pay', label: 'Төлбөр орж ирэхэд', hint: 'QPay ба дансны гүйлгээ бүрт' },
  { key: 'debt', label: 'Өр хугацаа хэтрэхэд', hint: 'Өдөр бүрийн 09:00-д нэгтгэж' },
  { key: 'poll', label: 'Санал хураалт дуусахад', hint: 'Дүн ба протокол бэлэн болоход' },
  { key: 'request', label: 'Шинэ засварын хүсэлт', hint: 'Засварчдад очдог; нягтланд заавал биш' },
]

// Эрхүүд — admin бүгдийг, оршин суугч зөвхөн эхний хэдийг нь харна
const permissions = [
  { label: 'Нэхэмжлэл үүсгэх, засах', roles: ['admin'] },
  { label: 'Бэлэн төлбөр бүртгэх', roles: ['admin'] },
  { label: 'Тайлан татах', roles: ['admin', 'user'] },
  { label: 'Зарлал нийтлэх', roles: ['admin'] },
  { label: 'Засварын хүсэлт илгээх', roles: ['admin', 'user'] },
  { label: 'Ажилтан нэмэх, эрх өгөх', roles: [] },
]

// Асаах/унтраах товч — role="switch" нь дэлгэц уншигчид асаалттай эсэхийг хэлнэ
function Switch({ label, checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={checked ? 'switch on' : 'switch'}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-knob" />
    </button>
  )
}

export default function Profile() {
  const { user, onLogout } = useOutletContext()
  const [name, setName] = useState(user.name ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [email, setEmail] = useState(user.email ?? '')
  const [twofa, setTwofa] = useState(true)
  const [notify, setNotify] = useState({ pay: true, debt: true, poll: true, request: false })
  const [sessions, setSessions] = useState(sampleSessions)
  const [toast, setToast] = useState('')

  const roleLabel = user.role === 'admin' ? 'Админ' : 'Оршин суугч'

  function saveInfo() {
    // Backend-д хадгалах API дараа нь — одоохондоо зөвхөн мэдэгдэл
    setToast('Хувийн мэдээлэл хадгалагдлаа')
  }

  function endSession(s) {
    setSessions(sessions.filter((x) => x.id !== s.id))
    setToast(`${s.name} төхөөрөмжөөс гаргалаа`)
  }

  return (
    <div className="profile">
      <section className="profile-hero" aria-label="Профайлын тойм">
        <span className="profile-avatar">
          {/* Зураг байхгүй тул нэрийн эхний үсэг */}
          {name[0]?.toUpperCase()}
          <button className="profile-photo" aria-label="Зураг солих">
            <PhotoCameraOutlined sx={{ fontSize: 16 }} />
          </button>
        </span>

        <div className="profile-who">
          <h1>{name}</h1>
          <span className="profile-sub">{roleLabel} · Нарны хотхоны СӨХ</span>
          <span className="profile-pills">
            {user.role === 'admin' && <span className="profile-pill good">Санхүүгийн эрх</span>}
            <span className="profile-pill warn">2 алхамт баталгаажуулалт {twofa ? 'идэвхтэй' : 'унтраалттай'}</span>
          </span>
        </div>

        <div className="profile-stats">
          {sampleStats.map((s) => (
            <div key={s.label} className="profile-stat">
              <span className="profile-stat-value">{s.value}</span>
              <span className="profile-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {toast && (
        <div className="profile-toast" role="status">
          <CheckOutlined sx={{ fontSize: 18 }} />
          {toast}
        </div>
      )}

      <div className="profile-columns">
        <div className="profile-col wide">
          <section className="profile-card" aria-labelledby="info-title">
            <div className="profile-card-head">
              <h2 id="info-title">Хувийн мэдээлэл</h2>
              <button className="profile-btn primary" onClick={saveInfo}>Хадгалах</button>
            </div>
            <div className="profile-form">
              <label className="profile-field">
                Нэр
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="profile-field">
                Утас
                <input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label className="profile-field">
                Имэйл
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="profile-field">
                Албан тушаал
                <input value={roleLabel} readOnly />
              </label>
              <label className="profile-field">
                Хэл
                <select>
                  <option>Монгол</option>
                  <option>English</option>
                </select>
              </label>
            </div>
            <span className="profile-muted">Албан тушаал ба эрхийг зөвхөн СӨХ-ийн дарга өөрчилнө.</span>
          </section>

          <section className="profile-card list" aria-labelledby="sec-title">
            <h2 id="sec-title">Нууцлал ба нэвтрэлт</h2>
            <div className="profile-row">
              <span className="profile-row-text">
                <span className="profile-row-label">Нууц үг</span>
                <span className="profile-muted">Сүүлд 64 хоногийн өмнө сольсон</span>
              </span>
              <button className="profile-btn">Солих</button>
            </div>
            <div className="profile-row">
              <span className="profile-row-text">
                <span className="profile-row-label">2 алхамт баталгаажуулалт</span>
                <span className="profile-muted">Нэвтрэх бүрт SMS код · санхүүгийн эрхтэй ажилтанд зөвлөнө</span>
              </span>
              <Switch label="2 алхамт баталгаажуулалт" checked={twofa} onChange={setTwofa} />
            </div>

            <span className="profile-subhead">Идэвхтэй төхөөрөмж</span>
            {sessions.map((s) => (
              <div key={s.id} className="profile-session">
                <span className="profile-device">
                  {s.phone ? <SmartphoneOutlined sx={{ fontSize: 20 }} /> : <ComputerOutlined sx={{ fontSize: 20 }} />}
                </span>
                <span className="profile-row-text">
                  <span className="profile-row-label">{s.name}</span>
                  <span className="profile-muted">{s.where}</span>
                </span>
                {s.current
                  ? <span className="profile-pill good">Энэ төхөөрөмж</span>
                  : <button className="profile-btn danger" onClick={() => endSession(s)}>Гаргах</button>}
              </div>
            ))}
          </section>
        </div>

        <div className="profile-col">
          <section className="profile-card list" aria-labelledby="notif-title">
            <h2 id="notif-title">Надад мэдэгдэх</h2>
            {notificationItems.map((n) => (
              <div key={n.key} className="profile-row">
                <span className="profile-row-text">
                  <span className="profile-row-label">{n.label}</span>
                  <span className="profile-muted">{n.hint}</span>
                </span>
                <Switch
                  label={n.label}
                  checked={notify[n.key]}
                  onChange={(value) => setNotify({ ...notify, [n.key]: value })}
                />
              </div>
            ))}
          </section>

          <section className="profile-card" aria-labelledby="perm-title">
            <h2 id="perm-title">Миний эрх</h2>
            {permissions.map((p) => {
              const on = p.roles.includes(user.role)
              return (
                <div key={p.label} className={on ? 'profile-perm on' : 'profile-perm'}>
                  <span className="profile-perm-icon">
                    {on ? <CheckOutlined sx={{ fontSize: 14 }} /> : <CloseOutlined sx={{ fontSize: 12 }} />}
                  </span>
                  {p.label}
                </div>
              )
            })}
          </section>

          <section className="profile-card" aria-labelledby="act-title">
            <div className="profile-card-head">
              <h2 id="act-title">Сүүлийн үйлдэл</h2>
              <Link to="/reports" className="profile-link">Аудит лог →</Link>
            </div>
            {sampleActivity.map((a) => (
              <div key={a.text} className="profile-activity">
                <span className="profile-dot" aria-hidden="true" />
                <span className="profile-row-text">
                  <span>{a.text}</span>
                  <span className="profile-muted small">{a.time}</span>
                </span>
              </div>
            ))}
          </section>

          <button className="profile-logout" onClick={onLogout}>Системээс гарах</button>
        </div>
      </div>
    </div>
  )
}
