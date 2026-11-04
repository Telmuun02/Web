'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAppContext } from '../components/App/AppShell'
import CheckOutlined from '@mui/icons-material/CheckOutlined'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import ComputerOutlined from '@mui/icons-material/ComputerOutlined'
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined'
import SmartphoneOutlined from '@mui/icons-material/SmartphoneOutlined'
import api from '../api/client'
import Badge from '../components/UI/Badge'
import Button from '../components/UI/Button'
import Card from '../components/UI/Card'
import Field from '../components/UI/Field'
import ListItem from '../components/UI/ListItem'
import Switch from '../components/UI/Switch'
import Toast from '../components/UI/Toast'
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

export default function Profile() {
  const { user, onLogout } = useAppContext()
  const [name, setName] = useState(user.name ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [email, setEmail] = useState(user.email ?? '')
  const [password, setPassword] = useState('') // мэдээлэл солихоос өмнө баталгаажуулах нууц үг
  const [error, setError] = useState('')
  const [twofa, setTwofa] = useState(true)
  const [notify, setNotify] = useState({ pay: true, debt: true, poll: true, request: false })
  const [sessions, setSessions] = useState(sampleSessions)
  const [toast, setToast] = useState('')

  const roleLabel = user.role === 'admin' ? 'Админ' : 'Оршин суугч'

  // PUT /api/profile — нууц үг буруу (401), утас/имэйл давхардсан (409) бол backend-ийн мессежийг харуулна
  async function saveInfo() {
    setError('')
    try {
      await api.put('/profile', { name, phone, email, password })
      setPassword('') // нууц үгийг талбарт үлдээхгүй
      setToast('Хувийн мэдээлэл хадгалагдлаа')
    } catch (err) {
      setError(err.message)
    }
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
            {user.role === 'admin' && <Badge tone="green">Санхүүгийн эрх</Badge>}
            <Badge tone="yellow">2 алхамт баталгаажуулалт {twofa ? 'идэвхтэй' : 'унтраалттай'}</Badge>
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

      <Toast>{toast}</Toast>

      <div className="profile-columns">
        <div className="profile-col wide">
          <Card
            title="Хувийн мэдээлэл"
            action={<Button variant="dark" size="small" onClick={saveInfo}>Хадгалах</Button>}
          >
            <div className="profile-form">
              <Field label="Нэр">
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Утас">
                <input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Field label="Имэйл">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="Албан тушаал">
                <input value={roleLabel} readOnly />
              </Field>
              <Field label="Одоогийн нууц үг">
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Өөрчлөлтөө баталгаажуулах"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
            </div>
            {error && <p className="profile-error" role="alert">{error}</p>}
            <span className="profile-muted">Албан тушаал ба эрхийг зөвхөн СӨХ-ийн дарга өөрчилнө.</span>
          </Card>

          <Card title="Нууцлал ба нэвтрэлт">
            {/* Мөрүүдийг нэг div-д — хооронд нь картын зай биш, зураас байна */}
            <div>
              <ListItem title="Нууц үг" hint="Сүүлд 64 хоногийн өмнө сольсон">
                <Button size="small">Солих</Button>
              </ListItem>
              <Switch
                label="2 алхамт баталгаажуулалт"
                hint="Нэвтрэх бүрт SMS код · санхүүгийн эрхтэй ажилтанд зөвлөнө"
                checked={twofa}
                onChange={setTwofa}
              />

              <span className="profile-subhead">Идэвхтэй төхөөрөмж</span>
              {sessions.map((s) => (
                <ListItem
                  key={s.id}
                  icon={(
                    <span className="profile-device">
                      {s.phone ? <SmartphoneOutlined sx={{ fontSize: 20 }} /> : <ComputerOutlined sx={{ fontSize: 20 }} />}
                    </span>
                  )}
                  title={s.name}
                  hint={s.where}
                >
                  {s.current
                    ? <Badge tone="green">Энэ төхөөрөмж</Badge>
                    : <Button size="small" variant="danger" onClick={() => endSession(s)}>Гаргах</Button>}
                </ListItem>
              ))}
            </div>
          </Card>
        </div>

        <div className="profile-col">
          <Card title="Надад мэдэгдэх">
            <div>
              {notificationItems.map((n) => (
                <Switch
                  key={n.key}
                  label={n.label}
                  hint={n.hint}
                  checked={notify[n.key]}
                  onChange={(value) => setNotify({ ...notify, [n.key]: value })}
                />
              ))}
            </div>
          </Card>

          <Card title="Миний эрх">
            <div className="profile-perms">
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
            </div>
          </Card>

          <Card title="Сүүлийн үйлдэл" action={<Link href="/reports" className="profile-link">Аудит лог →</Link>}>
            <div>
              {sampleActivity.map((a) => (
                <div key={a.text} className="profile-activity">
                  <span className="profile-dot" aria-hidden="true" />
                  <span className="profile-activity-text">
                    <span>{a.text}</span>
                    <span className="profile-muted small">{a.time}</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <button className="profile-logout" onClick={onLogout}>Системээс гарах</button>
        </div>
      </div>
    </div>
  )
}
