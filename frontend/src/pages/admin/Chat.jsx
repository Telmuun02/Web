/**
 * Чат (ажилтан) — /admin/chat. API: /api/messages (оршин суугчтай нэг controller)
 *
 * Оршин суугчдын СӨХ-тэй хувийн чатууд ба орцны группүүд — хоёуланд нь бичнэ, группт мессеж нууна.
 * Тоот хайж (/api/admin/units?q=) шинэ чат эхлүүлнэ. Бэлэн хариултууд дарахад шууд илгээгдэнэ.
 * canvas: AdminPhoneChat (вэб хэлбэрт). Шинэ мессеж ирэхэд WebSocket-оор шууд дахин татна.
 * URL: ?tab=groups — групп таб, ?room=soh:613 — нээлттэй чат
 */

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ChatThread from '../../components/Chat/ChatThread'
import PageHeader from '../../components/UI/PageHeader'
import Tabs from '../../components/UI/Tabs'
import SearchInput from '../../components/UI/SearchInput'
import api from '../../api/client'
import useApi from '../../hooks/useApi'
import useChatRoom from '../../hooks/useChatRoom'
import { monthDay } from '../../utils/format'
import './styles/Chat.css'

const quickReplies = ['Шалгаад хариу өгье', 'Засварчин өнөөдөр очно', 'Баримт имэйлээр очно', 'Баярлалаа!']

function shortTime(value) {
  if (!value) return ''
  const d = new Date(value)
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : monthDay(d)
}

export default function Chat() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'groups' ? 'groups' : 'inbox'
  const room = params.get('room')

  const { data, error } = useApi('/messages', null, { fallback: null, live: ['chat_messages'] })
  const chat = useChatRoom(room ? `/messages/${encodeURIComponent(room)}` : null)

  const [q, setQ] = useState('')
  const { data: found } = useApi(q.trim() ? '/admin/units' : null, { q: q.trim() }, { fallback: [], delay: 300 })

  const threads = data?.threads ?? []
  const groups = data?.groups ?? []
  const unreadTotal = threads.reduce((sum, t) => sum + t.unread, 0)
  const isGroup = room?.startsWith('entrance:')

  function select(next) {
    const p = {}
    if (tab === 'groups') p.tab = 'groups'
    if (next) p.room = next
    setParams(p, { replace: true })
  }

  function changeTab(key) {
    setParams(key === 'groups' ? { tab: 'groups' } : {}, { replace: true })
  }

  async function toggleHidden(m) {
    try {
      await api.patch(`/messages/item/${m.id}`, { hidden: !m.hidden })
    } catch (err) {
      window.alert(err.message)
    }
  }

  const head = chat.info?.header
  let title = ''
  let sub = ''
  if (head?.kind === 'soh') {
    title = head.title
    sub = (head.phones ?? []).join(' · ')
  } else if (head?.kind === 'entrance') {
    title = head.title
    sub = 'Орцны бүх оршин суугч харна · зүй бус мессежийг нууж болно'
  }

  return (
    <div className="admin-chat">
      <PageHeader
        sub="Оршин суугчидтай шууд харилцах"
        title="Чат"
        note={<span className="admin-chat-live"><i aria-hidden="true" />ШУУД · {unreadTotal} уншаагүй</span>}
      />

      <Tabs
        label="Чатын төрөл"
        value={tab}
        onChange={changeTab}
        items={[
          { key: 'inbox', label: 'Оршин суугчид', count: unreadTotal },
          { key: 'groups', label: 'Орцны группүүд' },
        ]}
      />

      {error && <p className="admin-chat-error">{error}</p>}

      <div className={room ? 'admin-chat-columns has-room' : 'admin-chat-columns'}>
        <div className="admin-chat-list">
          {tab === 'inbox' && (
            <SearchInput value={q} onChange={setQ} placeholder="Тоот эсвэл нэрээр хайж бичих" />
          )}
          {tab === 'inbox' && q.trim() && found.slice(0, 8).map((u) => (
            <button
              key={u.id}
              type="button"
              className="admin-chat-item"
              onClick={() => { setQ(''); select(`soh:${u.id}`) }}
            >
              <span className="admin-chat-av" aria-hidden="true">{u.code.split('-')[0]}</span>
              <span className="admin-chat-item-text">
                <strong>{u.code} тоот</strong>
                <span className="admin-chat-last">{u.name || 'Оршин суугч бүртгэлгүй'}</span>
              </span>
            </button>
          ))}
          {tab === 'inbox' && !q.trim() && threads.map((t) => (
            <button
              key={t.room}
              type="button"
              aria-pressed={t.room === room}
              className={t.room === room ? 'admin-chat-item on' : 'admin-chat-item'}
              onClick={() => select(t.room)}
            >
              <span className="admin-chat-av" aria-hidden="true">{t.unit.code.split('-')[0]}</span>
              <span className="admin-chat-item-text">
                <span className="admin-chat-item-top">
                  <strong>{t.unit.code} тоот</strong>
                  <small>{shortTime(t.last?.created_at)}</small>
                </span>
                <span className={t.unread ? 'admin-chat-last unread' : 'admin-chat-last'}>
                  {t.last ? `${t.last.sender.type === 'admin' ? 'СӨХ: ' : ''}${t.last.body}` : ''}
                </span>
              </span>
              {t.unread > 0 && <span className="admin-chat-badge">{t.unread}</span>}
            </button>
          ))}
          {tab === 'inbox' && !q.trim() && !threads.length && data && (
            <p className="admin-chat-empty">Чат алга. Дээрх хайлтаар тоот олж бичих эсвэл оршин суугч "СӨХ" чатад бичмэгц энд гарна.</p>
          )}

          {tab === 'groups' && groups.map((g) => (
            <button
              key={g.room}
              type="button"
              aria-pressed={g.room === room}
              className={g.room === room ? 'admin-chat-item on' : 'admin-chat-item'}
              onClick={() => select(g.room)}
            >
              <span className="admin-chat-av group" aria-hidden="true">{g.entrance.number}</span>
              <span className="admin-chat-item-text">
                <span className="admin-chat-item-top">
                  <strong>{g.entrance.number}-р орцны групп</strong>
                  <small>{shortTime(g.last?.created_at)}</small>
                </span>
                <span className="admin-chat-last">
                  {g.last ? `${g.last.sender.name}: ${g.last.body}` : `${g.homes} айл · мессеж алга`}
                </span>
              </span>
            </button>
          ))}
          {tab === 'groups' && (
            <p className="admin-chat-empty">
              Ажилтан группт бичиж, зүй бус мессежийг нууж болно. Оршин суугчдын бие биедээ бичсэн хувийн мессеж байхгүй.
            </p>
          )}
        </div>

        <section className="admin-chat-room" aria-label="Нээлттэй чат">
          {!room && <p className="admin-chat-placeholder">Зүүн талаас чат сонгоно уу</p>}
          {room && (
            <>
              <header className="admin-chat-head">
                <button type="button" className="admin-chat-back" aria-label="Жагсаалт руу буцах" onClick={() => select(null)}>
                  <ArrowBackRounded sx={{ fontSize: 20 }} />
                </button>
                <span className={isGroup ? 'admin-chat-av group' : 'admin-chat-av'} aria-hidden="true">
                  {head?.kind === 'entrance' ? head.entrance : head?.unit?.split('-')[0]}
                </span>
                <span className="admin-chat-head-text">
                  <strong>{title}</strong>
                  <small>{sub}</small>
                </span>
              </header>
              <ChatThread
                chat={chat}
                me={{ type: 'admin' }}
                adminSide
                placeholder="Хариу бичих…"
                quick={quickReplies}
                actions={isGroup ? (m) => (
                  <button type="button" onClick={() => toggleHidden(m)}>{m.hidden ? 'Харуулах' : 'Нуух'}</button>
                ) : undefined}
              />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
