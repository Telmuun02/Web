import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import Badge from '../../components/UI/Badge'
import Button from '../../components/UI/Button'
import Card from '../../components/UI/Card'
import Field from '../../components/UI/Field'
import PageHeader from '../../components/UI/PageHeader'
import ProgressBar from '../../components/UI/ProgressBar'
import Segmented from '../../components/UI/Segmented'
import Switch from '../../components/UI/Switch'
import Table from '../../components/UI/Table'
import Toast from '../../components/UI/Toast'
import api from '../../api/client'
import LiveBar from '../../components/admin/LiveBar'
import useApi from '../../hooks/useApi'
import { liveAnnouncements } from '../../samples/admin/live'
import './styles/Announcements.css'

// Хэнд илгээх — backend-ийн audience утга: 'all' эсвэл орцны дугаар
const audienceLabels = { all: 'Бүх орц', 1: '1-р орц', 2: '2-р орц', 3: '3-р орц' }

// /api/admin/announcements-ийн мөр → хүснэгтийн мөр.
// read — уншсан хувь: уншсаныг хадгалах хүснэгт DB-д одоохондоо алга тул null
function toPost(a) {
  const d = new Date(a.created_at)
  return {
    id: a.id,
    title: a.title,
    audience: audienceLabels[a.audience] ?? a.audience,
    date: `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, '0')}`,
    channel: a.sms ? 'Апп · SMS' : 'Апп',
    read: null,
    important: Boolean(a.important),
  }
}

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

// Шинэ зарлалын анхны утгууд
const emptyForm = { title: '', body: '', audience: 'all', sms: true, important: false }

export default function Announcements() {
  const { user } = useOutletContext()
  const isAdmin = user.role === 'admin' // оршин суугч зөвхөн нийтэлсэн зарлалыг харна
  // Шинэ зарлалын form — 5 талбар хамт хадгалагдана.
  // Урьдчилан харах хэсэг бичих зуур шинэчлэгддэг тул FormData биш state
  const [form, setForm] = useState(emptyForm)
  const [toast, setToast] = useState('')
  const { title, body, audience, sms, important } = form

  // ---------- Server state ----------
  const { data: list, reload } = useApi('/admin/announcements', null, { fallback: [] })
  const { data: units } = useApi('/admin/units', null, { fallback: [] }) // орц бүрийн тоотын тоонд
  const posts = list.map(toPost)

  // Derived — "Хэнд" сонголт бүрийн тоотын тоо
  const unitCount = (value) => (value === 'all' ? units.length : units.filter((u) => String(u.entrance) === value).length)
  const audienceOptions = Object.entries(audienceLabels).map(([value, label]) => ({
    value, label, note: `${unitCount(value)} тоот`,
  }))
  const target = { label: audienceLabels[audience], units: unitCount(audience) }

  // Нэг талбарыг солино: field('sms')(true)
  const field = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  // Урьдчилан харахад хоосон бол жишээ бичиг харуулна
  const previewTitle = title.trim() || 'Гарчиг энд харагдана'
  const previewBody = body.trim() || 'Агуулга энд харагдана'
  const cantPublish = !title.trim() || !body.trim()

  // POST /api/admin/announcements — хадгалаад жагсаалтыг дахин татна.
  // SMS-ийг backend одоохондоо илгээхгүй, зөвхөн тэмдэглэнэ
  async function publish() {
    if (cantPublish) return
    try {
      await api.post('/admin/announcements', form)
      reload()
      setForm((f) => ({ ...f, title: '', body: '' })) // хэнд, SMS сонголт хэвээр үлдэнэ
      setToast(`${target.units} тоотод зарлал илгээгдлээ`)
    } catch (err) {
      setToast(err.message)
    }
  }

  return (
    <div className="announcements">
      {/* Шууд мөр — түр жишээ өгөгдөлтэй */}
      <LiveBar {...liveAnnouncements} />

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
                onChange={(e) => field('title')(e.target.value)}
                placeholder="Жишээ: Халуун ус түр хаагдана"
              />
            </Field>

            <Field label="Агуулга">
              <textarea
                rows="5"
                value={body}
                onChange={(e) => field('body')(e.target.value)}
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
                onChange={field('audience')}
              />
            </fieldset>

            <div className="ann-switches">
              <Switch label="SMS-ээр давхар илгээх" hint="Апп суулгаагүй 24 тоотод ч хүрнэ" checked={sms} onChange={field('sms')} />
              <Switch label="Чухал зарлал" hint="Мэдэгдлээ унтраасан хүнд ч очно" checked={important} onChange={field('important')} />
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
                {/* read — уншсаныг хадгалах хүснэгт нэмэгдэх хүртэл null */}
                {p.read == null ? <span className="dim">—</span> : (
                  <span className="ann-read">
                    <ProgressBar value={p.read} size={8} />
                    <b>{p.read}%</b>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </Table>
        {posts.length === 0 && <p className="dim">Нийтэлсэн зарлал алга</p>}
      </Card>
    </div>
  )
}
