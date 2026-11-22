import { useState } from 'react'
import SendRounded from '@mui/icons-material/SendRounded'
import { monthDay } from '../../utils/format'
import './ChatThread.css'

// Мессежийн цаг: өнөөдрийнх бол '14:31', бусад '11/12 14:31'
function timeOf(value) {
  const d = new Date(value)
  const hm = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return d.toDateString() === new Date().toDateString() ? hm : `${monthDay(d)} ${hm}`
}

// Нэг өрөөний мессежүүд + бичих хэсэг. Оршин суугч, ажилтны чат хоёулаа хэрэглэнэ.
// chat        — useChatRoom()-ийн үр дүн
// me          — { type: 'user' | 'admin', id } — өөрийн мессежийг баруун талд
// canWrite    — false бол бичих хэсэг гарахгүй (ажилтан группт зөвхөн уншина)
// placeholder — бичих талбарын тайлбар
// banner      — мессежийн дээрх мөр (тогтоосон зарлал)
// quick       — бэлэн хариултууд ['Шалгаад хариу өгье', ...] — дарахад шууд илгээнэ
// actions     — (message) => JSX: мессеж бүрийн доорх товч (ажилтны "Нуух")
// adminSide   — true бол ажилтны мессежийг "өөрийн" гэж үзнэ (СӨХ-ийн бүх ажилтан нэг тал)
export default function ChatThread({ chat, me, canWrite = true, placeholder, banner, quick, actions, adminSide = false }) {
  const [sendError, setSendError] = useState('')
  const isMine = (m) => (adminSide ? m.sender.type === 'admin' : m.sender.type === me.type && m.sender.id === me.id)

  async function submit(e) {
    e.preventDefault()
    const form = e.currentTarget
    const text = new FormData(form).get('text').trim()
    if (!text) return
    form.reset()
    setSendError('')
    try {
      await chat.send(text)
    } catch (err) {
      form.elements.text.value = text // алдаа гарвал бичсэнийг буцааж тавина
      setSendError(err.message)
    }
  }

  async function sendQuick(text) {
    setSendError('')
    try {
      await chat.send(text)
    } catch (err) {
      setSendError(err.message)
    }
  }

  // column-reverse — шинэ мессеж доор, scroll өөрөө доод талд байна
  const list = chat.messages.slice().reverse()

  return (
    <div className="chat-thread">
      {banner}

      <div className="chat-thread-list" aria-live="polite">

        {list.map((m, i) => {
          const mine = isMine(m)
          const older = list[i + 1] // reverse тул өмнөх мессеж нь дараагийн индекс
          const showName = !mine && (!older || older.sender.type !== m.sender.type || older.sender.id !== m.sender.id)
          return (
            <div key={m.id} className={mine ? 'chat-row mine' : 'chat-row'}>
              {!mine && (
                <span className={m.sender.type === 'admin' ? 'chat-av admin' : 'chat-av'} aria-hidden="true">
                  {showName ? m.sender.name?.[0]?.toUpperCase() : ''}
                </span>
              )}
              <div className="chat-col">
                {showName && <span className="chat-who">{m.sender.name}{m.sender.sub && ` · ${m.sender.sub}`}</span>}
                <span className={m.hidden ? 'chat-bubble hidden' : 'chat-bubble'}>{m.body}</span>
                <span className="chat-meta">
                  {timeOf(m.created_at)}
                  {m.hidden && ' · нуусан'}
                  {actions?.(m)}
                </span>
              </div>
            </div>
          )
        })}

        {chat.hasOlder && (
          <button type="button" className="chat-older" onClick={chat.loadOlder}>Өмнөх мессежүүд</button>
        )}
        {!chat.loading && !chat.messages.length && !chat.error && (
          <p className="chat-empty">Мессеж алга. Эхнийхийг нь бичээрэй.</p>
        )}
        {chat.error && <p className="chat-empty">{chat.error}</p>}
      </div>

      {sendError && <p className="chat-error" role="alert">{sendError}</p>}

      {canWrite && quick?.length > 0 && (
        <div className="chat-quick">
          {quick.map((q) => (
            <button key={q} type="button" onClick={() => sendQuick(q)}>{q}</button>
          ))}
        </div>
      )}

      {canWrite && (
        <form className="chat-compose" onSubmit={submit}>
          <label className="chat-compose-field">
            <span className="visually-hidden">Мессеж бичих</span>
            <input name="text" placeholder={placeholder} autoComplete="off" maxLength={1000} />
          </label>
          <button type="submit" className="chat-send">
            <SendRounded sx={{ fontSize: 18 }} />
            <span>Илгээх</span>
          </button>
        </form>
      )}
    </div>
  )
}
