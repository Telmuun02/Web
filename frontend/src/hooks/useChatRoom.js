import { useEffect, useState } from 'react'
import api from '../api/client'
import { useTableChange } from './useRealtime'

const PAGE = 50

// Нэг чатын өрөөний мессежүүд. chat_messages өөрчлөгдөхөд (WebSocket) сүүлийн мессежүүдийг дахин татна.
//   const chat = useChatRoom('/resident/messages/entrance')
//   chat.messages, chat.send(text), chat.loadOlder()
//   chat.info — серверийн хариуны бусад талбар (ажилтны чатын header гэх мэт)
// url — GET өрөөний мессежүүд, POST шинэ мессеж, POST {url}/read уншсан. null бол юу ч хийхгүй
export default function useChatRoom(url) {
  // state.url — аль өрөөнийх вэ. Өрөө солигдоход url таарахгүй бол хоосон гэж үзнэ
  const [loaded, setState] = useState({ url: null, messages: [], info: null, error: '', hasOlder: false })
  const state = loaded.url === url ? { ...loaded, loading: false } : { url, messages: [], info: null, error: '', hasOlder: false, loading: Boolean(url) }

  // Өрөө солигдоход эхний хуудсыг татна
  useEffect(() => {
    if (!url) return
    let alive = true
    api.get(url)
      .then(({ messages, ...info }) => alive && setState({ url, messages, info, error: '', hasOlder: messages.length >= PAGE }))
      .catch((err) => alive && setState({ url, messages: [], info: null, error: err.message, hasOlder: false }))
    return () => {
      alive = false
    }
  }, [url])

  // Мессежүүдийг id-аар нэгтгэнэ — шинэ нь нэмэгдэж, нуусан нь солигдоно
  function merge(messages) {
    setState((s) => {
      if (s.url !== url) return s
      const byId = new Map(s.messages.map((m) => [m.id, m]))
      messages.forEach((m) => byId.set(m.id, m))
      return { ...s, messages: [...byId.values()].sort((a, b) => a.id - b.id) }
    })
  }

  // Шинэ мессеж ирэх / нуух үед сүүлийн мессежүүдийг татаад уншсан гэж тэмдэглэнэ
  useTableChange(url ? ['chat_messages'] : null, () => {
    api.get(url)
      .then(({ messages }) => {
        merge(messages)
        api.post(`${url}/read`).catch(() => {})
      })
      .catch(() => {})
  })

  async function send(text) {
    const message = await api.post(url, { text })
    merge([message])
    return message
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
    send,
    loadOlder,
  }
}
