import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import AddOutlined from '@mui/icons-material/AddOutlined'
import Badge from '../../components/UI/Badge'
import Button from '../../components/UI/Button'
import Card from '../../components/UI/Card'
import Field from '../../components/UI/Field'
import PageHeader from '../../components/UI/PageHeader'
import ProgressBar from '../../components/UI/ProgressBar'
import Table from '../../components/UI/Table'
import Toast from '../../components/UI/Toast'
import LiveBar from '../../components/admin/LiveBar'
import { livePolls } from '../../samples/admin/live'
import './styles/Polls.css'

const threshold = 50 // ирцийн босго (%) — үүнээс бага ирцтэй бол шийдвэр хүчингүй

// Түр жишээ өгөгдөл — санал хураалтын API нэмэгдэх хүртэл
const samplePoll = {
  question: 'Тоглоомын талбайг шинэчлэх үү?',
  closes: '11/20 19:00',
  info: 'Төсөв 18 сая₮ · нөөц сангаас · 11/06-нд эхэлсэн',
  units: 120, // санал өгөх эрхтэй нийт тоот
  entrances: [
    { name: '1-р орц', voted: 20, units: 40 },
    { name: '2-р орц', voted: 17, units: 30 },
    { name: '3-р орц', voted: 18, units: 50 },
  ],
  results: [
    { label: 'Тийм', votes: 38, color: 'var(--navy)' },
    { label: 'Үгүй', votes: 12, color: '#b42318' },
    { label: 'Түдгэлзсэн', votes: 5, color: '#9aa3b5' },
  ],
}

// turnout — ирц (%), yes — «Тийм» гэсэн хувь
const samplePast = [
  { id: 3, question: 'Зогсоолд хаалт суурилуулах', closed: '10/15', turnout: 68, yes: 71 },
  { id: 2, question: 'Сарын хураамжийг 10.2 сая₮ болгох', closed: '04/28', turnout: 74, yes: 58 },
  { id: 1, question: 'Хашаанд мод тарих', closed: '03/10', turnout: 41, yes: 83 },
]

const columns = [
  { label: 'Асуулт' },
  { label: 'Хаагдсан' },
  { label: 'Ирц', align: 'right' },
  { label: 'Тийм', align: 'right' },
  { label: 'Шийдвэр' },
  { label: 'Протокол', align: 'right' },
]

const emptyForm = { question: '', endDate: '', voters: 'owners', quorum: '50' }

// 20, 40 → 50. Нийт нь 0 бол 0-д хуваахгүй
function percent(part, total) {
  return total ? Math.round((part / total) * 100) : 0
}

// Ирц босгод хүрээгүй бол хүчингүй, хүрсэн бол олонхи «Тийм» гэсэн эсэхээр
function decision(p) {
  if (p.turnout < threshold) return { label: 'Босго хүрээгүй', tone: 'gray' }
  return p.yes > 50 ? { label: 'Батлагдсан', tone: 'green' } : { label: 'Татгалзсан', tone: 'red' }
}

export default function Polls() {
  const { user } = useOutletContext()
  const isAdmin = user.role === 'admin' // санал хураалт үүсгэх, сануулах товч зөвхөн admin-д
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [reminded, setReminded] = useState(false)

  const poll = samplePoll // API нэмэгдэхэд серверээс ирсэн өгөгдлөөр солигдоно
  const voted = poll.entrances.reduce((sum, e) => sum + e.voted, 0)
  const turnout = percent(voted, poll.units)
  const need = Math.ceil((poll.units * threshold) / 100) - voted // босгод хүрэхэд дутуу тоот
  const notVoted = poll.units - voted

  function change(field, value) {
    setForm({ ...form, [field]: value })
  }

  function closeForm() {
    setShowNew(false)
    setForm(emptyForm)
  }

  // Түр — санал хураалт үүсгэх API нэмэгдэх хүртэл зөвхөн маягтыг хаана (DB-д хадгалагдахгүй)
  function start() {
    closeForm()
  }

  return (
    <div className="polls">
      {/* Шууд мөр — түр жишээ өгөгдөлтэй */}
      <LiveBar {...livePolls} />

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

      <Toast>{reminded && `${notVoted} тоотод апп ба SMS сануулга явлаа`}</Toast>

      <Card aria-labelledby="poll-title">
        <div className="polls-head">
          <div className="polls-title">
            <Badge tone="orange">Идэвхтэй · {poll.closes} цагт хаагдана</Badge>
            <h2 id="poll-title">{poll.question}</h2>
            <span className="polls-info">{poll.info}</span>
          </div>
          {isAdmin && (
            <div className="polls-actions">
              {/* Түр — хугацаа сунгах API нэмэгдэх хүртэл ажиллахгүй */}
              <Button>Хугацаа сунгах</Button>
              {/* Түр — сануулга илгээх API нэмэгдэх хүртэл зөвхөн дэлгэц дээр */}
              <Button variant="dark" onClick={() => setReminded(true)} disabled={reminded}>
                {reminded ? 'Сануулга илгээгдсэн' : `Өгөөгүй ${notVoted} тоотод сануулах`}
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
              {poll.units} тоотоос {voted} нь өгсөн ·{' '}
              {need > 0 ? <>босго хүртэл <strong>{need} тоот</strong> дутуу</> : 'босго хангагдсан'}
            </span>

            <div className="polls-entrances">
              {poll.entrances.map((e) => (
                <div key={e.name} className="polls-entrance">
                  <span>{e.name}</span>
                  <ProgressBar value={percent(e.voted, e.units)} color="#6a62b8" />
                  <b>{e.voted}/{e.units}</b>
                </div>
              ))}
            </div>
          </div>

          <div className="polls-results">
            <span className="polls-subtitle">Одоогийн дүн</span>
            {poll.results.map((r) => (
              <div key={r.label} className="polls-result">
                <div className="polls-result-head">
                  <span>{r.label}</span>
                  <span className="polls-count"><strong>{r.votes}</strong> · {percent(r.votes, voted)}%</span>
                </div>
                <ProgressBar value={percent(r.votes, voted)} color={r.color} size={12} />
              </div>
            ))}
            <span className="polls-note">
              Санал нууц: ажилтан хэн юу гэж өгснийг харахгүй, зөвхөн хэн өгснийг харна.
            </span>
          </div>
        </div>
      </Card>

      <Card title="Өмнөх санал хураалт">
        <Table columns={columns} minWidth={680}>
          {samplePast.map((p) => {
            const d = decision(p)
            return (
              <tr key={p.id}>
                <td className="bold">{p.question}</td>
                <td className="dim">{p.closed}</td>
                <td className="num">{p.turnout}%</td>
                <td className="num">{p.yes}%</td>
                <td><Badge tone={d.tone}>{d.label}</Badge></td>
                <td className="num">
                  {/* Түр — протокол татах API нэмэгдэх хүртэл ажиллахгүй */}
                  <Button size="small">PDF татах</Button>
                </td>
              </tr>
            )
          })}
        </Table>
      </Card>
    </div>
  )
}
