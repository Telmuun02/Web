import { useState } from 'react'
import AddPhotoAlternateOutlined from '@mui/icons-material/AddPhotoAlternateOutlined'
import Field from '../../components/UI/Field'
import PageHeader from '../../components/UI/PageHeader'
import Switch from '../../components/UI/Switch'
import Toast from '../../components/UI/Toast'
// Backend-тэй түр холбоогүй — бүх өгөгдөл жишээ файлаас
import { requestSteps, requestTypes, sampleMyRequests } from '../../samples/resident/requests'
import './styles/Requests.css'

// Шинэ хүсэлтийн анхны утгууд
const emptyForm = { type: 'fix', title: '', body: '', anonymous: false }

export default function Requests() {
  // Шинэ хүсэлтийн form — 4 талбар хамт.
  // "Илгээх" товч гарчгийн уртаас хамаарч идэвхжих тул FormData биш state
  const [form, setForm] = useState(emptyForm)
  const [list, setList] = useState(sampleMyRequests)
  const [toast, setToast] = useState('')
  const { type, title, body, anonymous } = form

  // Нэг талбарыг солино: set('type')('complaint')
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const cantSend = title.trim().length < 3

  // Түр — хүсэлтийн API нэмэгдэх хүртэл зөвхөн дэлгэц дээр жагсаалтын эхэнд нэмнэ
  function send() {
    if (cantSend) return
    const item = { id: Date.now(), type, title: title.trim(), when: 'Одоо', step: 1, note: 'СӨХ хүлээн авахыг хүлээж байна', fresh: true }
    setList([item, ...list])
    setForm((f) => ({ ...f, title: '', body: '' })) // төрөл, нэр нууцлах сонголт хэвээр үлдэнэ
    setToast('Хүсэлт илгээгдлээ. Хариуг мэдэгдлээр авна.')
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
              onChange={(e) => { set('title')(e.target.value); setToast('') }}
              placeholder="Жишээ: Угаалтуурын доор ус дусаж байна"
            />
          </Field>

          <Field label="Дэлгэрэнгүй">
            <textarea
              rows="4"
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
            <div className="rq-anon">
              <Switch label="Нэрээ нууцлах" hint="Зөвхөн СӨХ-ийн дарга харна" checked={anonymous} onChange={set('anonymous')} />
            </div>
          </div>

          <Toast>{toast}</Toast>

          <button type="button" className="rq-send" onClick={send} disabled={cantSend}>Илгээх</button>
        </section>

        {/* Миний хүсэлтүүд */}
        <section className="rq-mine" aria-labelledby="mine-title">
          <h2 id="mine-title">Миний хүсэлт ({list.length})</h2>
          {list.map((r) => {
            const label = requestTypes.find((t) => t.id === r.type)?.label ?? r.type
            const done = r.step === requestSteps.length
            return (
              <article key={r.id} className={r.fresh ? 'rq-item fresh' : 'rq-item'}>
                <span className="rq-meta">{label} · {r.when}</span>
                <span className="rq-title">{r.title}</span>
                {/* Явц — хийгдсэн алхмууд тод, бүрэн шийдсэн бол ногоон */}
                <ol className={done ? 'rq-steps done' : 'rq-steps'} aria-label={`Явц: ${requestSteps[r.step - 1]}`}>
                  {requestSteps.map((s, i) => (
                    <li key={s} className={`${i < r.step ? 'reached' : ''}${i === r.step - 1 ? ' current' : ''}`.trim() || undefined}>
                      <span className="rq-bar" />{s}
                    </li>
                  ))}
                </ol>
                <span className="rq-note">{r.note}</span>
              </article>
            )
          })}
        </section>
      </div>
    </div>
  )
}
