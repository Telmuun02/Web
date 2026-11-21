import { useEffect, useRef, useState } from 'react'
import api from '../api/client'
import { send as sendRealtime } from '../api/realtime'
import useRealtime from './useRealtime'

const PAGE = 50
const TYPING_SHOW_MS = 4000 // "бичиж байна" хэдэн мс харагдах
const TYPING_SEND_MS = 2500 // өөрийнхөө typing-ийг хэдэн мс тутам нэг илгээх

// Нэг чатын өрөө — мессежүүд, шинэ мессеж WebSocket-оор шууд, "бичиж байна", онлайн хүмүүс.
//   const chat = useChatRoom('/resident/messages/entrance', 'entrance:34')
//   chat.messages, chat.send(text), chat.typing (нэрс), chat.online, chat.notifyTyping(), chat.loadOlder()
//   chat.info — серверийн хариуны бусад талбар (ажилтны чатын header гэх мэт)
// url  — GET өрөөний мессежүүд, POST шинэ мессеж, POST {url}/read уншсан
// room — серверийн өрөөний нэр ('entrance:34', 'soh:613'), WebSocket мессежийг шүүхэд. null бол юу ч хийхгүй
export default function useChatRoom(url, room) {
  // state.url — аль өрөөнийх вэ. Өрөө солигдоход хуучныг цэвэрлэх биш, url таарахгүй бол хоосон гэж үзнэ
  const [loaded, setState] = useState({ url: null, messages: [], info: null, error: '', hasOlder: false })
  const state = loaded.url === url ? { ...loaded, loading: false } : { url, messages: [], info: null, error: '', hasOlder: false, loading: Boolean(url) }
  const [typingState, setTyping] = useState({ room: null, people: {} }) // people: { 'user:613': { name, until } }
  const typing = typingState.room === room ? typingState.people : {}
  const [online, setOnline] = useState([])
  const lastTyping = useRef(0)
  const readTimer = useRef(null)

  // Өрөө солигдоход эхний хуудсыг татна
  useEffect(() => {
    if (!url) return
    let alive = true
    api.get(url)
      .then(({ messages, ...info }) => alive && setState({ url, messages, info, error: '', hasOlder: messages.length >= PAGE }))
      .catch((err) => alive && setState({ url, messages: [], info: null, error: err.message, hasOlder: false }))
    return () => {
      alive = false
      clearTimeout(readTimer.current)
    }
  }, [url])

  // Онлайн жагсаалтыг асууна — өрөө нээгдэх, дахин холбогдох, хэн нэгэн орж гарах бүрт
  useEffect(() => {
    if (room) sendRealtime({ type: 'presence', room })
  }, [room])

  // Мессеж нэмэх эсвэл (нуусан үед) солих — id-аар давхардуулахгүй
  function upsert(message) {
    setState((s) => {
      if (s.url !== url) return s
      const i = s.messages.findIndex((m) => m.id === message.id)
      if (i === -1) return { ...s, messages: [...s.messages, message] }
      const messages = s.messages.slice()
      messages[i] = message
      return { ...s, messages }
    })
  }

  useRealtime((msg) => {
    if (!room) return
    if (msg.type === 'connected' || msg.type === 'presence_changed') {
      sendRealtime({ type: 'presence', room })
      return
    }
    if (msg.room !== room && msg.message?.room !== room) return

    if (msg.type === 'chat') {
      upsert(msg.message)
      // Нээлттэй өрөөнд ирсэн мессежийг уншсан гэж тэмдэглэнэ (олон мессеж ирвэл нэг удаа)
      clearTimeout(readTimer.current)
      readTimer.current = setTimeout(() => api.post(`${url}/read`).catch(() => {}), 1000)
      // Бичсэн хүний "бичиж байна" арилна
      const key = `${msg.message.sender.type === 'admin' ? 'admin' : 'user'}:${msg.message.sender.id}`
      setTyping((t) => {
        const { [key]: _gone, ...rest } = t.room === room ? t.people : {} // eslint-disable-line no-unused-vars
        return { room, people: rest }
      })
    }
    if (msg.type === 'typing') {
      const key = `${msg.who.role}:${msg.who.id}`
      setTyping((t) => ({ room, people: { ...(t.room === room ? t.people : {}), [key]: { name: msg.who.name, until: Date.now() + TYPING_SHOW_MS } } }))
    }
    if (msg.type === 'presence') setOnline(msg.online)
  })

  // Хугацаа нь дууссан "бичиж байна"-г арилгана
  useEffect(() => {
    const keys = Object.keys(typingState.people)
    if (!keys.length) return
    const timer = setTimeout(() => {
      const now = Date.now()
      setTyping((t) => ({ room: t.room, people: Object.fromEntries(Object.entries(t.people).filter(([, v]) => v.until > now)) }))
    }, 1000)
    return () => clearTimeout(timer)
  }, [typingState])

  async function send(text) {
    const message = await api.post(url, { text })
    upsert(message)
    return message
  }

  // Input-д бичих бүрт дуудна — серверт 2.5 сек тутам нэг л удаа явуулна
  function notifyTyping() {
    const now = Date.now()
    if (!room || now - lastTyping.current < TYPING_SEND_MS) return
    lastTyping.current = now
    sendRealtime({ type: 'typing', room })
  }

  // Хуучин мессежүүд — жагсаалтын эхний мессежээс өмнөх 50
  async function loadOlder() {
    const first = state.messages[0]
    if (!first) return
    const data = await api.get(url, { params: { before: first.id } })
    setState((s) => (s.url === url ? { ...s, messages: [...data.messages, ...s.messages], hasOlder: data.messages.length >= PAGE } : s))
  }

  return {
    messages: state.messages,
    info: state.info,
    loading: state.loading,
    error: state.error,
    hasOlder: state.hasOlder,
    typing: Object.values(typing).map((t) => t.name),
    online,
    send,
    notifyTyping,
    loadOlder,
  }
}
