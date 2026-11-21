import { useState } from 'react'
import AddPhotoAlternateOutlined from '@mui/icons-material/AddPhotoAlternateOutlined'
import Field from '../../components/UI/Field'
import PageHeader from '../../components/UI/PageHeader'
import Toast from '../../components/UI/Toast'
import api from '../../api/client'
import useApi from '../../hooks/useApi'
import { monthDay } from '../../utils/format'
import './styles/Requests.css'

// Хүсэлтийн төрөл — id нь DB-ийн requests.category-той ижил, tint: үсгийн дэвсгэр
const requestTypes = [
  { id: 'plumbing', label: 'Сантехник', tint: 'var(--tint-navy)' },
  { id: 'electrical', label: 'Цахилгаан', tint: 'var(--tint-yellow)' },
  { id: 'elevator', label: 'Лифт', tint: 'var(--tint-orange)' },
  { id: 'cleaning', label: 'Цэвэрлэгээ', tint: 'var(--tint-green)' },
  { id: 'other', label: 'Бусад', tint: 'var(--tint-red)' },
]

const requestSteps = ['Илгээсэн', 'Хүлээн авсан', 'Хийгдэж байна', 'Шийдсэн']

// Backend-ийн stage → хэд дэх алхам хүртэл явсан (1–4)
const stageStep = { new: 1, assigned: 2, progress: 3, done: 4 }

// Хүсэлтийн доорх тайлбар мөр
function requestNote(r) {
  if (r.stage === 'new') return 'СӨХ хүлээн авахыг хүлээж байна'
  if (r.stage === 'assigned') return `${r.assigned_name ?? 'Ажилтан'} хариуцлаа`
  if (r.stage === 'progress') return `Хийгдэж байна${r.assigned_name ? ` · ${r.assigned_name}` : ''}`
  return r.status === 'rejected' ? 'Татгалзсан' : 'Шийдэгдсэн'
}

// Шинэ хүсэлтийн анхны утгууд
const emptyForm = { type: 'plumbing', title: '', body: '' }

export default function Requests() {
  // Шинэ хүсэлтийн form — "Илгээх" товч гарчгийн уртаас хамаарч идэвхжих тул FormData биш state
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState({ sending: false, toast: '', freshId: null })
  // GET /api/resident/requests — илгээсний дараа reload хийнэ
  const { data: list, loading, error, reload } = useApi('/resident/requests', null, { fallback: [], live: ['requests'] })
  const { type, title, body } = form

  // Нэг талбарыг солино: set('type')('electrical')
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const cantSend = title.trim().length < 3 || status.sending

  // POST /api/resident/requests — тоот, хэрэглэгчийг backend token-оос авна
  async function send() {
    if (cantSend) return
    setStatus({ sending: true, toast: '', freshId: null })
    try {
      const created = await api.post('/resident/requests', { category: type, title: title.trim(), description: body.trim() })
      setForm((f) => ({ ...f, title: '', body: '' })) // төрөл хэвээр үлдэнэ
      setStatus({ sending: false, toast: 'Хүсэлт илгээгдлээ. Явцыг энд харна.', freshId: created.id })
      reload()
    } catch (err) {
      setStatus({ sending: false, toast: err.message, freshId: null })
    }
  }

  return (
    <div className="res-requests">
      <PageHeader sub="Засвар, гомдол, санал — СӨХ-д шууд хүрнэ" title="Санал хүсэлт" />

      <div className="rq-columns">
        {/* Шинэ хүсэлт */}
        <section className="rq-form" aria-labelledby="form-title">
          <h2 id="form-title">Шинэ хүсэлт</h2>

          <fieldset className="rq-types">
            <legend>Юуны тухай вэ?</legend>
            <div className="rq-types-grid">
              {requestTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={type === t.id}
                  className={type === t.id ? 'rq-type on' : 'rq-type'}
                  onClick={() => set('type')(t.id)}
                >
                  <span className="rq-type-letter" style={{ background: t.tint }} aria-hidden="true">{t.label[0]}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>

          <Field label="Гарчиг">
            <input
              value={title}
              maxLength={150}
              onChange={(e) => { set('title')(e.target.value); setStatus((s) => ({ ...s, toast: '' })) }}
              placeholder="Жишээ: Угаалтуурын доор ус дусаж байна"
            />
          </Field>

          <Field label="Дэлгэрэнгүй">
            <textarea
              rows="4"
              maxLength={2000}
              value={body}
              onChange={(e) => set('body')(e.target.value)}
              placeholder="Хаана, хэзээнээс, ямар байдалтай байгааг бичнэ үү"
            />
          </Field>

          <div className="rq-extras">
            {/* Түр — зураг хадгалах API нэмэгдэх хүртэл ажиллахгүй */}
            <button type="button" className="rq-photo">
              <AddPhotoAlternateOutlined sx={{ fontSize: 22 }} /> Зураг нэмэх · 3 хүртэл
            </button>
          </div>

          <Toast>{status.toast}</Toast>

          <button type="button" className="rq-send" onClick={send} disabled={cantSend}>
            {status.sending ? 'Илгээж байна…' : 'Илгээх'}
          </button>
        </section>

        {/* Миний хүсэлтүүд */}
        <section className="rq-mine" aria-labelledby="mine-title">
          <h2 id="mine-title">Миний хүсэлт ({list.length})</h2>
          {error && <p role="alert">{error}</p>}
          {!error && loading && list.length === 0 && <p>Ачааллаж байна…</p>}
          {!error && !loading && list.length === 0 && <p>Та одоогоор хүсэлт илгээгээгүй байна</p>}
          {list.map((r) => {
            const label = requestTypes.find((t) => t.id === r.category)?.label ?? r.category
            const step = stageStep[r.stage]
            const done = step === requestSteps.length
            return (
              <article key={r.id} className={r.id === status.freshId ? 'rq-item fresh' : 'rq-item'}>
                <span className="rq-meta">{label} · {monthDay(r.created_at)}</span>
                <span className="rq-title">{r.title}</span>
                {/* Явц — хийгдсэн алхмууд тод, бүрэн шийдсэн бол ногоон */}
                <ol className={done ? 'rq-steps done' : 'rq-steps'} aria-label={`Явц: ${requestSteps[step - 1]}`}>
                  {requestSteps.map((s, i) => (
                    <li key={s} className={`${i < step ? 'reached' : ''}${i === step - 1 ? ' current' : ''}`.trim() || undefined}>
                      <span className="rq-bar" />{s}
                    </li>
                  ))}
                </ol>
                <span className="rq-note">{requestNote(r)}</span>
              </article>
            )
          })}
        </section>
      </div>
    </div>
  )
}
