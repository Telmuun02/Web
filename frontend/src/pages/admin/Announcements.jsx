/**
 * Зарлал — /admin/announcements
 * Шинэ зарлал бичих (бүх орц эсвэл нэг орцонд), нийтэлсэн зарлалууд feed хэлбэрээр, сэтгэгдэлтэй (FeedPost).
 * "Хурал зарлах" асаавал зарлалтай хамт хурал үүснэ (meeting: { starts_at, ends_at }), жагсаалтаас /admin/meeting руу орно.
 * Пост бүрийн баруун дээд "Засах" товчоор тухайн пост дотроо гарчиг, агуулгыг засна (PATCH /api/admin/announcements/:id).
 * Санал хураалтууд ч зарлалтай нэг feed-д пост хэлбэрээр, огноогоор холилдож харагдана (GET /api/admin/polls).
 * GET/POST /api/admin/announcements, GET /api/admin/units (орцны тоо), useLive('announcements')
 */

import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Badge from '../../components/UI/Badge'
import Button from '../../components/UI/Button'
import Card from '../../components/UI/Card'
import Field from '../../components/UI/Field'
import PageHeader from '../../components/UI/PageHeader'
import Segmented from '../../components/UI/Segmented'
import Switch from '../../components/UI/Switch'
import Toast from '../../components/UI/Toast'
import api from '../../api/client'
import FeedPost from '../../components/Feed/FeedPost'
import PollSummary from '../../components/Feed/PollSummary'
import LiveBar from '../../components/admin/LiveBar'
import useLive from '../../hooks/useLive'
import useApi from '../../hooks/useApi'
import { monthDay } from '../../utils/format'
import './styles/Announcements.css'

const audienceLabels = { all: 'Бүх орц', 1: '1-р орц', 2: '2-р орц', 3: '3-р орц' }

function toPost(a) {
  return {
    ...a,
    author: a.created_by_name || 'СӨХ',
    audience: audienceLabels[a.audience] ?? a.audience,
    channel: a.sms ? 'Апп · SMS' : 'Апп',
    meetingId: a.meeting_id ?? null,
  }
}

const pollTag = {
  active: (p) => `Санал хураалт · ${monthDay(p.ends_at)} хүртэл`,
  upcoming: (p) => `Санал хураалт · ${monthDay(p.starts_at)}-нд эхэлнэ`,
  ended: () => 'Санал хураалт · дууссан',
}

function pollResult(p) {
  if (p.status !== 'ended') return null
  return p.turnout_percent >= p.threshold_percent && p.yes_votes * 2 > p.votes ? 'passed' : 'failed'
}

const smsLimit = 160

function smsText(title, body) {
  const text = `СӨХ: ${title}. ${body}`
  return text.length > smsLimit ? `${text.slice(0, smsLimit - 3)}...` : text
}

const emptyForm = { title: '', body: '', audience: 'all', sms: true, important: false, meeting: false, startsAt: '', endsAt: '' }

const toDbTime = (value) => `${value.replace('T', ' ')}:00`

export default function Announcements() {
  const live = useLive('announcements')
  const { user } = useOutletContext()
  const isAdmin = user.role === 'admin'

  const [form, setForm] = useState(emptyForm)
  const [toast, setToast] = useState('')
  const { title, body, audience, sms, important, meeting, startsAt, endsAt } = form

  const { data: list, reload } = useApi('/admin/announcements', null, { fallback: [], live: ['announcements'] })
  const { data: units } = useApi('/admin/units', null, { fallback: [], live: ['units', 'users'] })
  const { data: polls } = useApi('/admin/polls', null, { fallback: [], live: ['polls', 'poll_votes'] })
  const posts = list.map(toPost)
  const feed = [
    ...posts.map((p) => ({ kind: 'post', key: `a${p.id}`, date: p.created_at, item: p })),
    ...polls.map((p) => ({ kind: 'poll', key: `p${p.id}`, date: p.starts_at, item: p })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date))

  const unitCount = (value) => (value === 'all' ? units.length : units.filter((u) => String(u.entrance) === value).length)
  const audienceOptions = Object.entries(audienceLabels).map(([value, label]) => ({
    value, label, note: `${unitCount(value)} тоот`,
  }))
  const target = { label: audienceLabels[audience], units: unitCount(audience) }

  const field = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const previewTitle = title.trim() || 'Гарчиг энд харагдана'
  const previewBody = body.trim() || 'Агуулга энд харагдана'
  const badTime = meeting && (!startsAt || !endsAt || endsAt <= startsAt)
  const cantPublish = !title.trim() || !body.trim() || badTime

  async function publish() {
    if (cantPublish) return
    try {
      await api.post('/admin/announcements', {
        title, body, audience, sms, important,
        meeting: meeting ? { starts_at: toDbTime(startsAt), ends_at: toDbTime(endsAt) } : null,
      })
      reload()
      setForm((f) => ({ ...f, title: '', body: '', meeting: false, startsAt: '', endsAt: '' }))
      setToast(`${target.units} тоотод зарлал илгээгдлээ`)
    } catch (err) {
      setToast(err.message)
    }
  }

  return (
    <div className="announcements">

      <LiveBar stats={live.stats} events={live.events} />

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
              <Switch label="Хурал зарлах" hint="Зарлалаас онлайн хурал руу орно" checked={meeting} onChange={field('meeting')} />
            </div>

            {meeting && (
              <div className="ann-meeting">
                <Field label="Эхлэх">
                  <input type="datetime-local" value={startsAt} onChange={(e) => field('startsAt')(e.target.value)} />
                </Field>
                <Field label="Дуусах">
                  <input type="datetime-local" value={endsAt} min={startsAt} onChange={(e) => field('endsAt')(e.target.value)} />
                </Field>
              </div>
            )}

            <div className="ann-footer">
              <span className="ann-cost">
                {sms ? `${target.units} SMS · ойролцоогоор [SMS ҮНЭ]₮` : 'Зөвхөн апп-аар · үнэгүй'}
              </span>
              <div className="ann-buttons">

                <Button>Ноорог хадгалах</Button>
                <Button variant="primary" onClick={publish} disabled={cantPublish}>Нийтлэх</Button>
              </div>
            </div>
          </Card>

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
                {meeting && <span className="ann-notice-meeting">Хуралд орох</span>}
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

      <section className="ann-feed" aria-labelledby="ann-feed-title">
        <h2 id="ann-feed-title">Нийтэлсэн зарлал ба санал хураалт</h2>
        {feed.length === 0 && <p className="dim">Нийтэлсэн зарлал алга</p>}
        {feed.map(({ kind, key, item: p }) => kind === 'poll' ? (
          <FeedPost
            key={key}
            post={{ id: p.id, title: p.title, body: p.description, created_at: p.starts_at }}
            author="СӨХ"
            meta="Бүх айл"
            tag={pollTag[p.status]?.(p)}
            comments={false}
            action={<Link to="/admin/polls" className="ann-meeting-link">Дэлгэрэнгүй</Link>}
          >
            {p.status !== 'upcoming' && (
              <PollSummary
                yes={p.votes ? Math.round((p.yes_votes / p.votes) * 100) : 0}
                turnout={p.turnout_percent}
                threshold={p.threshold_percent}
                note={`${p.votes}/${p.total_units} айл`}
                result={pollResult(p)}
              />
            )}
          </FeedPost>
        ) : (
          <FeedPost
            key={key}
            post={p}
            author={p.author}
            meta={`${p.audience} · ${p.channel}`}
            action={p.meetingId && <Link to="/admin/meeting" className="ann-meeting-link">Хурал руу</Link>}
            onSave={isAdmin ? async (changes) => { await api.patch(`/admin/announcements/${p.id}`, changes); reload() } : undefined}
          />
        ))}
      </section>
    </div>
  )
}
