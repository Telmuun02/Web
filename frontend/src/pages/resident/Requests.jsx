/**
 * Санал хүсэлт — /requests
 * Засвар, гомдол, санал илгээх (төрөл сонгоно), өөрийн хүсэлтүүдийн явц.
 * GET/POST /api/resident/requests
 */

import { useState } from 'react'
import AddPhotoAlternateOutlined from '@mui/icons-material/AddPhotoAlternateOutlined'
import Field from '../../components/UI/Field'
import Switch from '../../components/UI/Switch'
import PageHeader from '../../components/UI/PageHeader'
import Toast from '../../components/UI/Toast'
import api from '../../api/client'
import useApi from '../../hooks/useApi'
import { monthDay } from '../../utils/format'
import './styles/Requests.css'

const requestTypes = [
  { id: 'plumbing', label: 'Сантехник', tint: 'var(--tint-navy)' },
  { id: 'electrical', label: 'Цахилгаан', tint: 'var(--tint-yellow)' },
  { id: 'elevator', label: 'Лифт', tint: 'var(--tint-orange)' },
  { id: 'cleaning', label: 'Цэвэрлэгээ', tint: 'var(--tint-green)' },
  { id: 'other', label: 'Бусад', tint: 'var(--tint-red)' },
]

const requestSteps = ['Илгээсэн', 'Хүлээн авсан', 'Хийгдэж байна', 'Шийдсэн']

const stageStep = { new: 1, assigned: 2, progress: 3, done: 4 }

function requestNote(r) {
  if (r.stage === 'new') return 'СӨХ хүлээн авахыг хүлээж байна'
  if (r.stage === 'assigned') return `${r.assigned_name ?? 'Ажилтан'} хариуцлаа`
  if (r.stage === 'progress') return `Хийгдэж байна${r.assigned_name ? ` · ${r.assigned_name}` : ''}`
  return r.status === 'rejected' ? 'Татгалзсан' : 'Шийдэгдсэн'
}

const emptyForm = { type: 'plumbing', title: '', body: '', anonymous: false }

export default function Requests() {
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState({ sending: false, toast: '', freshId: null })

  const { data: list, loading, error, reload } = useApi('/resident/requests', null, { fallback: [] })
  const { type, title, body, anonymous } = form

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const cantSend = title.trim().length < 3 || status.sending

  async function send() {
    if (cantSend) return
    setStatus({ sending: true, toast: '', freshId: null })
    try {
      const created = await api.post('/resident/requests', { category: type, title: title.trim(), description: body.trim(), anonymous })
      setForm((f) => ({ ...f, title: '', body: '' }))
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

          <Switch label="Нэрээ нууцлах" hint="Зөвхөн СӨХ-ийн дарга харна" checked={anonymous} onChange={set('anonymous')} />

          <div className="rq-extras">

            <button type="button" className="rq-photo">
              <AddPhotoAlternateOutlined sx={{ fontSize: 22 }} /> Зураг нэмэх · 3 хүртэл
            </button>
          </div>

          <Toast>{status.toast}</Toast>

          <button type="button" className="rq-send" onClick={send} disabled={cantSend}>
            {status.sending ? 'Илгээж байна…' : 'Илгээх'}
          </button>
        </section>

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
