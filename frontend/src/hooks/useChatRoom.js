/**
 * Нэг чатын өрөөний мессежүүд. chat_messages өөрчлөгдөхөд (WebSocket) сүүлийн мессежүүдийг дахин татна.
 *   const chat = useChatRoom('/messages/entrance:34')
 *   chat.messages, chat.send(text), chat.loadOlder()
 *   chat.info — серверийн хариуны бусад талбар (ажилтны чатын header гэх мэт)
 * url — GET өрөөний мессежүүд, POST шинэ мессеж, POST {url}/read уншсан. null бол юу ч хийхгүй
 */

import { useEffect, useState } from 'react'
import api from '../api/client'
import { useTableChange } from './useRealtime'

const PAGE = 50

export default function useChatRoom(url) {
  const [loaded, setState] = useState({ url: null, messages: [], info: null, error: '', hasOlder: false })
  const state = loaded.url === url ? { ...loaded, loading: false } : { url, messages: [], info: null, error: '', hasOlder: false, loading: Boolean(url) }

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

  function merge(messages) {
    setState((s) => {
      if (s.url !== url) return s
      const byId = new Map(s.messages.map((m) => [m.id, m]))
      messages.forEach((m) => byId.set(m.id, m))
      return { ...s, messages: [...byId.values()].sort((a, b) => a.id - b.id) }
    })
  }

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
