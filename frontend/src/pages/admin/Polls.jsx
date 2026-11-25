/**
 * Санал хураалт — /admin/polls
 * Шинэ санал хураалт үүсгэх (зөвхөн admin), идэвхтэй ба өмнөх санал хураалтууд: ирц, «Тийм» %, хүчинтэй эсэх.
 * Ирц босгод хүрээгүй бол хүчингүй, хүрсэн бол олонхи «Тийм» гэсэн эсэхээр шийднэ.
 * GET/POST /api/admin/polls, useLive('polls')
 */

import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import AddOutlined from '@mui/icons-material/AddOutlined'
import api from '../../api/client'
import Badge from '../../components/UI/Badge'
import Button from '../../components/UI/Button'
import Card from '../../components/UI/Card'
import Field from '../../components/UI/Field'
import PageHeader from '../../components/UI/PageHeader'
import ProgressBar from '../../components/UI/ProgressBar'
import Table from '../../components/UI/Table'
import Toast from '../../components/UI/Toast'
import LiveBar from '../../components/admin/LiveBar'
import useApi from '../../hooks/useApi'
import useLive from '../../hooks/useLive'
import './styles/Polls.css'

const defaultThreshold = 50

const pollOptions = ['Тийм', 'Үгүй', 'Түдгэлзсэн']
const optionColors = ['var(--accent)', '#b42318', '#9aa3b5']

const columns = [
  { label: 'Асуулт' },
  { label: 'Хаагдсан' },
  { label: 'Ирц', align: 'right' },
  { label: 'Тийм', align: 'right' },
  { label: 'Шийдвэр' },
  { label: 'Протокол', align: 'right' },
]

const emptyForm = { question: '', endDate: '', voters: 'owners', quorum: '50' }

function percent(part, total) {
  return total ? Math.round((part / total) * 100) : 0
}

function dateLabel(value, withTime) {
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  const date = `${d.getMonth() + 1}/${pad(d.getDate())}`
  return withTime ? `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}` : date
}

function decision(p) {
  if (p.turnout < p.threshold) return { label: 'Босго хүрээгүй', tone: 'gray' }
  return p.yes > 50 ? { label: 'Батлагдсан', tone: 'green' } : { label: 'Татгалзсан', tone: 'red' }
}

export default function Polls() {
  const live = useLive('polls')
  const { user } = useOutletContext()
  const isAdmin = user.role === 'admin'
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [toast, setToast] = useState('')

  const { data: list, reload } = useApi('/admin/polls', null, { fallback: [], live: ['polls', 'poll_votes'] })
  const activeItem = list.find((p) => p.status === 'active')

  const { data: active } = useApi(activeItem ? `/admin/polls/${activeItem.id}` : null, null, { fallback: null, live: ['polls', 'poll_votes'] })
  const poll = active?.id === activeItem?.id ? active : null

  const threshold = poll?.threshold_percent ?? defaultThreshold
  const voted = poll?.voted_units ?? 0
  const units = poll?.total_units ?? 0
  const turnout = percent(voted, units)
  const need = Math.ceil((units * threshold) / 100) - voted
  const notVoted = units - voted

  const past = list
    .filter((p) => p.status === 'ended')
    .map((p) => ({
      id: p.id,
      question: p.title,
      closed: dateLabel(p.ends_at),
      turnout: p.turnout_percent,
      yes: percent(p.yes_votes, p.votes),
      threshold: p.threshold_percent,
    }))

  function change(field, value) {
    setForm({ ...form, [field]: value })
  }

  function closeForm() {
    setShowNew(false)
    setForm(emptyForm)
  }

  async function start() {
    try {
      await api.post('/admin/polls', {
        title: form.question,
        ends_at: new Date(`${form.endDate}T23:59:00`).toISOString(),
        threshold_percent: Number(form.quorum),
        options: pollOptions,
      })
      reload()
      closeForm()
      setToast('Санал хураалт эхэллээ')
    } catch (err) {
      setToast(err.message)
    }
  }

  return (
    <div className="polls">
      <LiveBar stats={live.stats} events={live.events} />

      <PageHeader sub={`Шийдвэр хүчинтэй болох босго: ирц ${threshold}%, олонхи «Тийм»`} title="Санал хураалт">
        {isAdmin && (
          <Button variant="primary" onClick={() => setShowNew(!showNew)} aria-expanded={showNew}>
            <AddOutlined sx={{ fontSize: 18 }} /> Шинэ санал хураалт
          </Button>
        )}
      </PageHeader>

      {showNew && (
        <Card title="Шинэ санал хураалт">
          <div className="polls-form">
            <Field label="Асуулт" className="polls-question">
              <input
                value={form.question}
                onChange={(e) => change('question', e.target.value)}
                placeholder="Жишээ: Орцны хаалгыг шинэчлэх үү?"
              />
            </Field>
            <Field label="Дуусах огноо">
              <input type="date" value={form.endDate} onChange={(e) => change('endDate', e.target.value)} />
            </Field>
            <Field label="Хэн санал өгөх">
              <select value={form.voters} onChange={(e) => change('voters', e.target.value)}>
                <option value="owners">Өмчлөгч · 1 тоот = 1 санал</option>
                <option value="adults">Бүх насанд хүрсэн оршин суугч</option>
              </select>
            </Field>
            <Field label="Ирцийн босго">
              <select value={form.quorum} onChange={(e) => change('quorum', e.target.value)}>
                <option value="50">50%</option>
                <option value="67">2/3</option>
                <option value="0">Босгогүй</option>
              </select>
            </Field>
          </div>
          <div className="polls-form-actions">
            <Button onClick={closeForm}>Цуцлах</Button>
            <Button variant="dark" onClick={start} disabled={!form.question.trim() || !form.endDate}>
              Эхлүүлэх
            </Button>
          </div>
        </Card>
      )}

      <Toast>{toast}</Toast>

      {poll ? (
        <Card aria-labelledby="poll-title">
          <div className="polls-head">
            <div className="polls-title">
              <Badge tone="orange">Идэвхтэй · {dateLabel(poll.ends_at, true)} цагт хаагдана</Badge>
              <h2 id="poll-title">{poll.title}</h2>
              {poll.description && <span className="polls-info">{poll.description}</span>}
            </div>
            {isAdmin && (
              <div className="polls-actions">

                <Button>Хугацаа сунгах</Button>
                <Button variant="dark" onClick={() => setToast(`${notVoted} тоотод апп ба SMS сануулга явлаа`)}>
                  Өгөөгүй {notVoted} тоотод сануулах
                </Button>
              </div>
            )}
          </div>

          <div className="polls-body">
            <div className="polls-turnout">
              <div className="polls-turnout-head">
                <span className="polls-subtitle">Ирц</span>
                <span className="polls-turnout-value">{turnout}%</span>
              </div>
              <ProgressBar value={turnout} size={16} marker={threshold} label={`Ирц ${turnout}%, босго ${threshold}%`} />
              <span className="polls-need">
                {units} тоотоос {voted} нь өгсөн ·{' '}
                {need > 0 ? <>босго хүртэл <strong>{need} тоот</strong> дутуу</> : 'босго хангагдсан'}
              </span>
            </div>

            <div className="polls-results">
              <span className="polls-subtitle">Одоогийн дүн</span>
              {poll.options.map((o, i) => (
                <div key={o.id} className="polls-result">
                  <div className="polls-result-head">
                    <span>{o.label}</span>
                    <span className="polls-count"><strong>{o.votes}</strong> · {percent(o.votes, voted)}%</span>
                  </div>
                  <ProgressBar value={percent(o.votes, voted)} color={optionColors[i] ?? '#6a62b8'} size={12} />
                </div>
              ))}
              <span className="polls-note">
                Санал нууц: ажилтан хэн юу гэж өгснийг харахгүй, зөвхөн хэн өгснийг харна.
              </span>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <p className="polls-info">Идэвхтэй санал хураалт алга{isAdmin && ' · «Шинэ санал хураалт» товчоор эхлүүлнэ үү'}</p>
        </Card>
      )}

      <Card title="Өмнөх санал хураалт">
        <Table columns={columns} minWidth={680}>
          {past.map((p) => {
            const d = decision(p)
            return (
              <tr key={p.id}>
                <td className="bold">{p.question}</td>
                <td className="dim">{p.closed}</td>
                <td className="num">{p.turnout}%</td>
                <td className="num">{p.yes}%</td>
                <td><Badge tone={d.tone}>{d.label}</Badge></td>
                <td className="num">

                  <Button size="small">PDF татах</Button>
                </td>
              </tr>
            )
          })}
        </Table>
        {past.length === 0 && <p className="polls-info">Дууссан санал хураалт алга</p>}
      </Card>
    </div>
  )
}
