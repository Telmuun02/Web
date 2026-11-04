'use client'

import { useState } from 'react'
import { useAppContext } from '../components/App/AppShell'
import Badge from '../components/UI/Badge'
import Button from '../components/UI/Button'
import Card from '../components/UI/Card'
import Field from '../components/UI/Field'
import PageHeader from '../components/UI/PageHeader'
import ProgressBar from '../components/UI/ProgressBar'
import Segmented from '../components/UI/Segmented'
import Switch from '../components/UI/Switch'
import Table from '../components/UI/Table'
import Toast from '../components/UI/Toast'
import './styles/Announcements.css'

// Хэнд илгээх — орц бүрийн тоотын тоо (түр жишээ, тоотын API нэмэгдэх хүртэл)
const audiences = [
  { value: 'all', label: 'Бүх орц', units: 120 },
  { value: 'e1', label: '1-р орц', units: 40 },
  { value: 'e2', label: '2-р орц', units: 30 },
  { value: 'e3', label: '3-р орц', units: 50 },
]

// Segmented-д өгөх сонголтууд — нэрийн ард тоотын тоо
const audienceOptions = audiences.map((a) => ({ value: a.value, label: a.label, note: `${a.units} тоот` }))

// Түр жишээ өгөгдөл — зарлалын API нэмэгдэх хүртэл. read — уншсан хувь
const samplePosts = [
  { id: 4, title: 'Хурал 11/20, Пүрэв 19:00 цагт онлайнаар', audience: 'Бүх орц', date: '11/10', channel: 'Апп', read: 64, important: false },
  { id: 3, title: '2-р орцны лифтний засвар 11/08-нд', audience: '2-р орц', date: '11/06', channel: 'Апп · SMS', read: 72, important: true },
  { id: 2, title: 'Өвлийн бэлтгэл: цонхоо битүүлэх зөвлөмж', audience: 'Бүх орц', date: '11/01', channel: 'Апп', read: 48, important: false },
  { id: 1, title: '11-р сарын нэхэмжлэл гарлаа', audience: 'Бүх орц', date: '11/01', channel: 'Апп · SMS', read: 91, important: false },
]

const columns = [
  { label: 'Гарчиг' },
  { label: 'Хэнд' },
  { label: 'Огноо' },
  { label: 'Суваг' },
  { label: 'Уншсан', width: 200 },
]

const smsLimit = 160 // нэг SMS-д багтах тэмдэгт

// SMS-ийн текст — 160 тэмдэгтээс урт бол тайраад '...' залгана
function smsText(title, body) {
  const text = `СӨХ: ${title}. ${body}`
  return text.length > smsLimit ? `${text.slice(0, smsLimit - 3)}...` : text
}

export default function Announcements() {
  const { user } = useAppContext()
  const isAdmin = user.role === 'admin' // оршин суугч зөвхөн нийтэлсэн зарлалыг харна
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState('all')
  const [sms, setSms] = useState(true)
  const [important, setImportant] = useState(false)
  const [posts, setPosts] = useState(samplePosts)
  const [toast, setToast] = useState('')

  const target = audiences.find((a) => a.value === audience)
  // Урьдчилан харахад хоосон бол жишээ бичиг харуулна
  const previewTitle = title.trim() || 'Гарчиг энд харагдана'
  const previewBody = body.trim() || 'Агуулга энд харагдана'
  const cantPublish = !title.trim() || !body.trim()

  // Түр — зарлалын API нэмэгдэх хүртэл зөвхөн дэлгэц дээр нэмнэ (DB-д хадгалагдахгүй)
  function publish() {
    if (cantPublish) return
    const post = {
      id: Date.now(),
      title: title.trim(),
      audience: target.label,
      date: 'Одоо',
      channel: sms ? 'Апп · SMS' : 'Апп',
      read: 0,
      important,
    }
    setPosts([post, ...posts])
    setTitle('')
    setBody('')
    setToast(`${target.units} тоотод зарлал илгээгдлээ`)
  }

  return (
    <div className="announcements">
      <PageHeader
        sub={isAdmin ? 'Оршин суугчдад апп ба SMS-ээр хүрнэ' : 'СӨХ-ийн мэдээ, мэдэгдэл'}
        title="Зарлал"
      />

      <Toast>{toast}</Toast>

      {isAdmin && (
        <div className="ann-columns">
          <Card title="Шинэ зарлал" className="ann-compose">
            <Field label="Гарчиг">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Жишээ: Халуун ус түр хаагдана"
              />
            </Field>

            <Field label="Агуулга">
              <textarea
                rows="5"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Хэзээ, хаана, юу болох, оршин суугч юу хийх ёстойг товч бичнэ үү"
              />
            </Field>

            <fieldset className="ann-audience">
              <legend>Хэнд</legend>
              <Segmented
                variant="pills"
                label="Хэнд"
                options={audienceOptions}
                value={audience}
                onChange={setAudience}
              />
            </fieldset>

            <div className="ann-switches">
              <Switch label="SMS-ээр давхар илгээх" hint="Апп суулгаагүй 24 тоотод ч хүрнэ" checked={sms} onChange={setSms} />
              <Switch label="Чухал зарлал" hint="Мэдэгдлээ унтраасан хүнд ч очно" checked={important} onChange={setImportant} />
            </div>

            <div className="ann-footer">
              <span className="ann-cost">
                {sms ? `${target.units} SMS · ойролцоогоор [SMS ҮНЭ]₮` : 'Зөвхөн апп-аар · үнэгүй'}
              </span>
              <div className="ann-buttons">
                {/* Түр — ноорог хадгалах API нэмэгдэх хүртэл ажиллахгүй */}
                <Button>Ноорог хадгалах</Button>
                <Button variant="primary" onClick={publish} disabled={cantPublish}>Нийтлэх</Button>
              </div>
            </div>
          </Card>

          {/* Бичих зуур оршин суугчийн утсан дээр яг ямар харагдахыг харуулна */}
          <aside className="ann-preview" aria-label="Урьдчилан харах">
            <span className="ann-preview-label">Оршин суугчийн утсан дээр</span>
            <div className="ann-phone">
              <div className="ann-notice">
                <span className="ann-notice-meta">
                  {important && <Badge tone="red" small>Чухал</Badge>}
                  СӨХ · одоо · {target.label}
                </span>
                <span className="ann-notice-title">{previewTitle}</span>
                <span className="ann-notice-body">{previewBody}</span>
              </div>
              {sms && (
                <div className="ann-sms">
                  <span className="ann-sms-label">SMS · {smsLimit} тэмдэгт хүртэл</span>
                  {smsText(previewTitle, previewBody)}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      <Card title="Нийтэлсэн зарлал">
        <Table columns={columns} minWidth={720}>
          {posts.map((p) => (
            <tr key={p.id}>
              <td className="bold">
                <span className="ann-post-title">
                  {p.important && <Badge tone="red" small>Чухал</Badge>}
                  {p.title}
                </span>
              </td>
              <td className="dim">{p.audience}</td>
              <td className="dim">{p.date}</td>
              <td className="dim">{p.channel}</td>
              <td>
                <span className="ann-read">
                  <ProgressBar value={p.read} size={8} />
                  <b>{p.read}%</b>
                </span>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
