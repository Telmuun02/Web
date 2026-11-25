/**
 * Чат — орцны групп ба СӨХ-тэй хувийн чат (canvas: WebChat).
 * Шинэ мессеж ирэхэд WebSocket-оор шууд дахин татна (hooks/useChatRoom).
 * Сонгосон өрөө URL-д: /chat (групп), /chat?tab=soh
 */

import { Link, useOutletContext } from 'react-router-dom'
import PushPinOutlined from '@mui/icons-material/PushPinOutlined'
import ChatThread from '../../components/Chat/ChatThread'
import useApi from '../../hooks/useApi'
import useChatRoom from '../../hooks/useChatRoom'
import useTabParam from '../../hooks/useTabParam'
import './styles/Chat.css'

const positionLabel = { chairman: 'СӨХ-ийн дарга', accountant: 'Нягтлан', technician: 'Засварчин', staff: 'Ажилтан' }

function preview(last) {
  if (!last) return 'Мессеж алга'
  return `${last.sender.name}: ${last.body}`
}

export default function Chat() {
  const { user } = useOutletContext()
  const [key, setKey] = useTabParam('entrance')

  const { data, error } = useApi('/resident/messages', null, { fallback: null, live: ['chat_messages'] })
  const room = data?.rooms.find((r) => r.key === key) ?? data?.rooms[0]
  const chat = useChatRoom(room ? `/resident/messages/${room.key}` : null)

  if (error) return <p className="res-chat-error">{error}</p>
  if (!data || !room) return null

  const isGroup = room.key === 'entrance'

  const homes = Object.values(data.neighbors.reduce((map, n) => {
    if (n.unitId !== user.unit_id && !map[n.unitId]) map[n.unitId] = { key: n.unitId, name: n.name }
    return map
  }, {}))

  const people = isGroup
    ? homes.slice(0, 8)
    : data.staff.map((s) => ({ key: s.id, name: s.name, sub: positionLabel[s.position] ?? 'Ажилтан', admin: true }))

  const subtitle = isGroup ? `${data.homes} айл` : 'СӨХ-ийн ажилтан хариулна'

  return (
    <div className="res-chat">
      <aside className="res-chat-rooms" aria-label="Чатууд">
        <h1>Чат</h1>
        {data.rooms.map((r) => {
          const on = r.key === room.key
          return (
            <button
              key={r.key}
              type="button"
              aria-pressed={on}
              className={on ? 'res-chat-room on' : 'res-chat-room'}
              onClick={() => setKey(r.key)}
            >
              <span className={r.key === 'soh' ? 'res-chat-room-icon soh' : 'res-chat-room-icon'} aria-hidden="true">
                {r.key === 'soh' ? 'С' : r.title[0]}
              </span>
              <span className="res-chat-room-text">
                <strong>{r.title}</strong>
                <span>{preview(r.last)}</span>
              </span>
              {!on && r.unread > 0 && <span className="res-chat-badge">{r.unread}</span>}
            </button>
          )
        })}
        <p className="res-chat-note">
          Групп чатад зөвхөн {data.rooms[0].title.replace(' групп', '')} оршин суугчид нэгдэнэ. Зүй бус мессежийг СӨХ нууж болно.
        </p>
      </aside>

      <section className="res-chat-main" aria-labelledby="res-chat-title">
        <header className="res-chat-head">
          <h2 id="res-chat-title">{isGroup ? room.title : 'СӨХ-тэй чат'}</h2>
          <span className="res-chat-live"><i aria-hidden="true" />{subtitle}</span>
        </header>
        <ChatThread
          chat={chat}
          me={{ type: 'user', id: user.id }}
          placeholder={isGroup ? 'Хөршүүддээ бичих…' : 'СӨХ-д бичих…'}
          banner={isGroup && data.pinned && (
            <Link to="/news" className="res-chat-pinned">
              <PushPinOutlined sx={{ fontSize: 16 }} />
              <span><strong>Тогтоосон · СӨХ:</strong> {data.pinned.title}</span>
            </Link>
          )}
        />
      </section>

      <aside className="res-chat-side" aria-label="Чатын мэдээлэл">
        <section className="res-chat-people" aria-labelledby="res-chat-people-title">
          <h2 id="res-chat-people-title">
            {isGroup ? `Хөршүүд · ${homes.length}` : 'СӨХ-ийн ажилтан'}
          </h2>
          {people.map((p) => (
            <div key={p.key} className="res-chat-person">
              <span className={p.admin ? 'res-chat-person-av admin' : 'res-chat-person-av'} aria-hidden="true">
                {p.name[0]}
              </span>
              <span>
                <strong>{p.name}</strong>
                {p.sub && <small>{p.sub}</small>}
              </span>
            </div>
          ))}
        </section>
        <Link to="/requests" className="res-chat-cta">
          <strong>Засвар хэрэгтэй юу?</strong>
          <span>Чатад бичихээс илүү хурдан шийдэгдэхийн тулд засварын хүсэлт илгээгээрэй →</span>
        </Link>
      </aside>
    </div>
  )
}
