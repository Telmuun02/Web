import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import useRealtime from '../../hooks/useRealtime'
import './Notifications.css'

const SHOW_MS = 6000
const MAX = 4

// Realtime мэдэгдлүүд — баруун дээд буланд toast болж гарна (WebSocket-оос { type: 'notify' }).
// Дээр нь дарвал link руу шилжинэ, 6 сек болоход өөрөө алга болно. Зэрэг 4-өөс илүүг харуулахгүй.
// Тухайн хуудсандаа байгаа бол (жишээ нь чатын мессеж чат дээр) toast гаргахгүй — дэлгэц дээр аль хэдийн харагдана.
// Layout (ажилтан), ResidentLayout (оршин суугч)-д нэг удаа тавина.
export default function Notifications() {
  const [items, setItems] = useState([])
  const navigate = useNavigate()
  const location = useLocation()

  const remove = (id) => setItems((list) => list.filter((n) => n.id !== id))

  useRealtime((msg) => {
    if (msg.type !== 'notify') return
    if (msg.link && msg.link === location.pathname) return
    const id = Date.now() + Math.random()
    setItems((list) => [...list, { ...msg, id }].slice(-MAX))
    setTimeout(() => remove(id), SHOW_MS)
  })

  if (!items.length) return null

  return (
    <div className="ui-notifications" role="status" aria-live="polite">
      {items.map((n) => (
        <div key={n.id} className="ui-notification">
          <button
            type="button"
            className="ui-notification-body"
            onClick={() => {
              remove(n.id)
              if (n.link) navigate(n.link)
            }}
          >
            <NotificationsOutlined sx={{ fontSize: 20 }} />
            <span>
              <strong>{n.title}</strong>
              {n.body && <small>{n.body}</small>}
            </span>
          </button>
          <button type="button" className="ui-notification-close" aria-label="Хаах" onClick={() => remove(n.id)}>
            <CloseOutlined sx={{ fontSize: 16 }} />
          </button>
        </div>
      ))}
    </div>
  )
}
