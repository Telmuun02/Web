import { useEffect, useRef, useState } from 'react'
import ChatBubbleOutlineOutlined from '@mui/icons-material/ChatBubbleOutlineOutlined'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import MicNoneOutlined from '@mui/icons-material/MicNoneOutlined'
import SendOutlined from '@mui/icons-material/SendOutlined'
import SmartToyOutlined from '@mui/icons-material/SmartToyOutlined'
import StopRounded from '@mui/icons-material/StopRounded'
import api from '../../api/client'
import { useRecorder } from '../../hooks/useRecorder'
import './ChatWidget.css'

// Оршин суугч, ажилтан хоёрт өөр API, мэндчилгээ.
// history — ажилтны бот өмнөх мессежүүдийг (сүүлийн 10) хамт авч "тэр тоот" гэх мэт үргэлжлүүлсэн асуултыг ойлгоно.
// Оршин суугчийнх зардал хэмнэхийн тулд зөвхөн одоогийн мессежийг авна
const MODES = {
  resident: {
    chat: '/resident/chat',
    transcribe: '/resident/transcribe',
    title: 'СӨХ туслах',
    greeting: 'Сайн байна уу! Би СӨХ Hub-ын туслах. Танд юугаар туслах вэ?',
    history: false,
  },
  admin: {
    chat: '/admin/chat',
    transcribe: '/admin/transcribe',
    title: 'Ажилтны туслах',
    greeting: 'Сайн байна уу! Би ажилтны туслах. Өр, төлбөр, хүсэлт, тоот, оршин суугч, зарлага, санал хураалтын талаар асуугаарай. Жишээ нь: "Энэ сарын цуглуулалт хэд хувьтай байна?"',
    history: true,
  },
}
const HISTORY = 10

// Чатыг зөвхөн энэ tab-ын sessionStorage-д хадгална — хуудас солих, refresh хийхэд үлдэнэ,
// tab хаахад устна. Хэрэглэгч бүрт тусдаа түлхүүр — нэг tab-д өөр хүн нэвтэрвэл холилдохгүй
function storageKey(mode, userId) {
  return `chat:${mode}:${userId}`
}

function loadMessages(mode, userId) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey(mode, userId)))
    if (Array.isArray(saved) && saved.length) {
      // Хариулт ирэхээс өмнө refresh хийсэн бол "хүлээж байна" төлөвт гацахгүй
      if (saved[saved.length - 1].from === 'user') {
        return [...saved, { from: 'bot', text: 'Хариулт тасарсан. Дахин илгээнэ үү.', error: true }]
      }
      return saved
    }
  } catch {
    // Хадгалсан зүйл эвдэрсэн эсвэл sessionStorage хаалттай — шинээр эхэлнэ
  }
  return [{ from: 'bot', text: MODES[mode].greeting }]
}

// Чатбот — баруун доод буланд бөөрөнхий товч, дарахад чатын цонх гарна.
// mode: 'resident' (ResidentLayout) | 'admin' (Layout)
// messages: [{ from: 'user' | 'bot', text, error? }]
export default function ChatWidget({ userId, mode = 'resident' }) {
  const config = MODES[mode]
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(() => loadMessages(mode, userId))
  const [transcribing, setTranscribing] = useState(false) // дууг текст болгож байгаа эсэх
  const listRef = useRef(null)
  const inputRef = useRef(null)
  // Chimege 15 секундээс урт дуу авахгүй — хугацаа дуусмагц автоматаар зогсоож текст болгоно
  const recorder = useRecorder({ maxSeconds: 15, onLimit: () => finishVoice() })
  const left = recorder.maxSeconds - recorder.seconds // үлдсэн секунд

  // Сүүлийн мессеж хэрэглэгчийнх бол бот хариулж байна гэсэн үг — тусдаа state хэрэггүй
  const waiting = messages[messages.length - 1].from === 'user'

  // Өөрчлөгдөх бүрт sessionStorage-д хадгална
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey(mode, userId), JSON.stringify(messages))
    } catch {
      // Хадгалж чадахгүй бол зүгээр — зөвхөн refresh хийхэд чат алга болно
    }
  }, [messages, mode, userId])

  // Шинэ мессеж нэмэгдэх бүрт хамгийн доод руу гүйлгэнэ
  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, open])

  // Цонх нээлттэй үед Esc дарахад хаагдана
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Бичиж байхад цонхыг хаавал бичлэгийг хаяж, микрофоныг чөлөөлнө
  useEffect(() => {
    if (!open) recorder.cancel()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function showError(text) {
    setMessages((m) => [...m, { from: 'bot', text, error: true }])
  }

  // Микрофон товч: 1-р дарахад бичиж эхэлнэ, 2-р дарахад (эсвэл 15 сек болоход) зогсоож текст болгоно
  async function toggleVoice() {
    if (!recorder.recording) {
      try {
        await recorder.start()
      } catch (err) {
        showError(err.message)
      }
      return
    }
    finishVoice()
  }

  async function finishVoice() {
    setTranscribing(true)
    try {
      const wav = await recorder.stop()
      if (!wav) return
      const text = await transcribe(wav)
      // Шууд илгээхгүй — хэрэглэгч шалгаж, засаад өөрөө илгээнэ
      if (text && inputRef.current) {
        inputRef.current.value = text
        autoGrow()
        inputRef.current.focus()
      }
    } catch (err) {
      showError(err.message)
    } finally {
      setTranscribing(false)
    }
  }

  // Дууг текст болгоно — backend-ээр дамжуулж Chimege руу
  // (Chimege токен frontend-д байж болохгүй тул шууд хандахгүй)
  async function transcribe(wav) {
    const { text } = await api.post(config.transcribe, wav, {
      headers: { 'Content-Type': 'audio/wav' },
    })
    return text
  }

  // Textarea-г агуулгынх нь өндөрт тааруулна — CSS-ийн max-height-аас хэтэрвэл доторх scroll гарна
  function autoGrow() {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  // Enter — илгээнэ, Shift+Enter — шинэ мөр
  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      e.currentTarget.form.requestSubmit()
    }
  }

  // Input-ийн утгыг state-д хадгалахгүй — илгээх мөчид FormData-аас уншина (PayDrawer шиг)
  async function send(e) {
    e.preventDefault()
    const form = e.target
    const text = new FormData(form).get('text').trim()
    if (!text || waiting) return
    form.reset()
    autoGrow()

    // Ажилтны бот: өмнөх мессежүүдийг (мэндчилгээ, алдаагүй) хамт илгээнэ. Оршин суугчийнх: зөвхөн одоогийнхыг
    const history = config.history
      ? messages.slice(1).filter((m) => !m.error).slice(-HISTORY).map(({ from, text: t }) => ({ from, text: t }))
      : undefined

    setMessages((m) => [...m, { from: 'user', text }])

    try {
      const { reply } = await api.post(config.chat, { text, history })
      setMessages((m) => [...m, { from: 'bot', text: reply }])
    } catch (err) {
      setMessages((m) => [...m, { from: 'bot', text: err.message, error: true }])
    }
  }

  return (
    <div className="chat">
      {open && (
        <section className="chat-panel" role="dialog" aria-label="Чатбот">
          <header className="chat-head">
            <span className="chat-avatar"><SmartToyOutlined sx={{ fontSize: 20 }} /></span>
            <div className="chat-title">
              <strong>{config.title}</strong>
              <span>{waiting ? 'Бичиж байна...' : 'Онлайн'}</span>
            </div>
            <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Хаах">
              <CloseOutlined sx={{ fontSize: 20 }} />
            </button>
          </header>

          <div className="chat-list" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg chat-msg-${m.from}${m.error ? ' chat-msg-error' : ''}`}>
                {m.text}
              </div>
            ))}
            {waiting && <div className="chat-msg chat-msg-bot chat-typing">...</div>}
          </div>

          <form className="chat-form" onSubmit={send}>
            <textarea
              ref={inputRef}
              name="text"
              rows={1}
              onInput={autoGrow}
              onKeyDown={onKeyDown}
              placeholder={
                recorder.recording ? 'Сонсож байна... дуусаад дахин дарна уу'
                  : transcribing ? 'Текст болгож байна...'
                  : 'Мессеж бичих...'
              }
              autoComplete="off"
              maxLength={1000}
              autoFocus
            />
            {/* Үлдсэн хугацаа — 5 сек үлдэхэд улаан болно */}
            {recorder.recording && (
              <span className={`chat-timer${left <= 5 ? ' chat-timer-low' : ''}`} aria-live="polite">
                0:{String(left).padStart(2, '0')}
              </span>
            )}
            {/* Микрофон — бичиж байхад улаан, зогсоох дүрс */}
            <button
              type="button"
              className={`chat-mic${recorder.recording ? ' chat-mic-on' : ''}`}
              onClick={toggleVoice}
              disabled={transcribing}
              aria-label={recorder.recording ? 'Бичлэг зогсоох' : 'Дуугаар бичих'}
              aria-pressed={recorder.recording}
            >
              {recorder.recording ? <StopRounded sx={{ fontSize: 20 }} /> : <MicNoneOutlined sx={{ fontSize: 20 }} />}
            </button>
            <button type="submit" className="chat-send" aria-label="Илгээх" disabled={waiting}>
              <SendOutlined sx={{ fontSize: 18 }} />
            </button>
          </form>
        </section>
      )}

      {/* Бөөрөнхий товч — нээлттэй үед X болж хувирна */}
      <button
        type="button"
        className="chat-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Чат хаах' : 'Чат нээх'}
        aria-expanded={open}
      >
        {open ? <CloseOutlined /> : <ChatBubbleOutlineOutlined />}
      </button>
    </div>
  )
}
