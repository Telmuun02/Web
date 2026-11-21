// Realtime — сервертэй нэг л WebSocket холболт, бүх хуудас хуваалцана.
//   const off = subscribe((msg) => { ... })   // msg: { type: 'change', tables } эсвэл { type: 'notify', title, body, link }
//   off()                                     // хуудаснаас гарахад
//   send({ type: 'typing', room })            // сервер рүү (чатын "бичиж байна", онлайн жагсаалт асуух)
// Холбогдох бүрт (дахин холбогдсон ч) listener-үүд { type: 'connected' } авна — онлайн жагсаалтаа дахин асууна.
// Эхний subscribe холболтыг нээж, сүүлийнх нь гарснаас 1 сек хойш хаана (гарсан хэрэглэгчид холболт үлдэхгүй;
// StrictMode-ийн давхар mount, хуудас солих үед холболт дэмий тасарч нээгдэхгүй).
// Тасарвал 1с → 2с → 4с ... 30с хүртэл хүлээгээд дахин холбогдоно. 4001 = нэвтрэлт дууссан → /login.
// 25 сек тутам 'ping' — холболт чимээгүй тасрахаас сэргийлнэ (сервер 'pong' хариулна).

const PING_MS = 25000
const MAX_RETRY_MS = 30000
const CLOSE_DELAY_MS = 1000

const listeners = new Set()
let socket = null
let retryMs = 1000
let retryTimer = null
let pingTimer = null
let closeTimer = null

function url() {
  const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${scheme}://${window.location.host}/api/realtime`
}

function connect() {
  socket = new WebSocket(url())

  socket.onopen = () => {
    retryMs = 1000
    listeners.forEach((fn) => fn({ type: 'connected' }))
    pingTimer = setInterval(() => socket?.readyState === WebSocket.OPEN && socket.send('ping'), PING_MS)
  }

  socket.onmessage = (event) => {
    if (event.data === 'pong') return
    let msg
    try {
      msg = JSON.parse(event.data)
    } catch {
      return
    }
    listeners.forEach((fn) => fn(msg))
  }

  socket.onclose = (event) => {
    clearInterval(pingTimer)
    socket = null
    if (event.code === 4001) {
      window.location.assign('/login')
      return
    }
    if (!listeners.size) return
    retryTimer = setTimeout(() => {
      retryTimer = null
      connect()
    }, retryMs)
    retryMs = Math.min(retryMs * 2, MAX_RETRY_MS)
  }
}

function disconnect() {
  clearTimeout(retryTimer)
  clearInterval(pingTimer)
  if (socket) {
    socket.onclose = null
    socket.close()
    socket = null
  }
}

// Холболт нээлттэй бол илгээнэ, үгүй бол хаяна (typing, presence алдагдсан ч зүгээр)
export function send(data) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data))
}

export function subscribe(fn) {
  listeners.add(fn)
  clearTimeout(closeTimer)
  if (!socket && !retryTimer) connect()

  return () => {
    listeners.delete(fn)
    if (listeners.size) return
    clearTimeout(closeTimer)
    closeTimer = setTimeout(() => {
      if (listeners.size) return
      disconnect()
      retryTimer = null
    }, CLOSE_DELAY_MS)
  }
}
