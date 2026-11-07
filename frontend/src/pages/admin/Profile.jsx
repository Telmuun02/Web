import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import CheckOutlined from '@mui/icons-material/CheckOutlined'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import ComputerOutlined from '@mui/icons-material/ComputerOutlined'
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined'
import SmartphoneOutlined from '@mui/icons-material/SmartphoneOutlined'
import api from '../../api/client'
import Badge from '../../components/UI/Badge'
import Button from '../../components/UI/Button'
import Card from '../../components/UI/Card'
import Field from '../../components/UI/Field'
import ListItem from '../../components/UI/ListItem'
import Switch from '../../components/UI/Switch'
import Toast from '../../components/UI/Toast'
import LiveBar from '../../components/admin/LiveBar'
import { liveProfile } from '../../samples/admin/live'
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
  const { user, onLogout } = useOutletContext()
  // Хувийн мэдээллийн form — 4 талбар хамт хадгалагдана. password — өөрчлөлтөө баталгаажуулах нууц үг.
  // Нэрийг дээд хэсэгт бичих зуур харуулдаг тул FormData биш state
  const [form, setForm] = useState({
    name: user.name ?? '',
    phone: user.phone ?? '',
    email: user.email ?? '',
    password: '',
  })
  // Тохиргооны бүх унтраалга нэг object-д: 2 алхамт баталгаажуулалт + мэдэгдлүүд
  const [prefs, setPrefs] = useState({ twofa: true, pay: true, debt: true, poll: true, request: false })
  const [sessions, setSessions] = useState(sampleSessions)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const roleLabel = user.role === 'admin' ? 'Админ' : 'Оршин суугч'

  // <input onChange={edit('phone')} /> — form-ын нэг талбарыг солино
  const edit = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  // <Switch onChange={toggle('twofa')} /> — нэг унтраалгыг солино
  const toggle = (key) => (value) => setPrefs((p) => ({ ...p, [key]: value }))

  // PUT /api/profile — нууц үг буруу (401), утас/имэйл давхардсан (409) бол backend-ийн мессежийг харуулна
  async function saveInfo() {
    setError('')
    try {
      await api.put('/profile', form)
      setForm((f) => ({ ...f, password: '' })) // нууц үгийг талбарт үлдээхгүй
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
      {/* Шууд мөр — түр жишээ өгөгдөлтэй */}
      <LiveBar {...liveProfile} />

      <section className="profile-hero" aria-label="Профайлын тойм">
        <span className="profile-avatar">
          {/* Зураг байхгүй тул нэрийн эхний үсэг */}
          {form.name[0]?.toUpperCase()}
          <button className="profile-photo" aria-label="Зураг солих">
            <PhotoCameraOutlined sx={{ fontSize: 16 }} />
          </button>
        </span>

        <div className="profile-who">
          <h1>{form.name}</h1>
          <span className="profile-sub">{roleLabel} · Нарны хотхоны СӨХ</span>
          <span className="profile-pills">
            {user.role === 'admin' && <Badge tone="green">Санхүүгийн эрх</Badge>}
            <Badge tone="yellow">2 алхамт баталгаажуулалт {prefs.twofa ? 'идэвхтэй' : 'унтраалттай'}</Badge>
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
                <input value={form.name} onChange={edit('name')} />
              </Field>
              <Field label="Утас">
                <input inputMode="tel" value={form.phone} onChange={edit('phone')} />
              </Field>
              <Field label="Имэйл">
                <input type="email" value={form.email} onChange={edit('email')} />
              </Field>
              <Field label="Албан тушаал">
                <input value={roleLabel} readOnly />
              </Field>
              <Field label="Одоогийн нууц үг">
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Өөрчлөлтөө баталгаажуулах"
                  value={form.password}
                  onChange={edit('password')}
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
                checked={prefs.twofa}
                onChange={toggle('twofa')}
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
                  checked={prefs[n.key]}
                  onChange={toggle(n.key)}
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

          <Card title="Сүүлийн үйлдэл" action={<Link to="/admin/reports" className="profile-link">Аудит лог →</Link>}>
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
