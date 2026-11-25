/**
 * Хурал — /meeting
 * Онлайн хурлын өрөө (CallRoom): ажилтан хурал нээсэн бол "Нэгдэх" дарж WebRTC-ээр орно.
 * Удахгүй болох хурал, хэлэлцэх асуудал, хуралд орох тохиргоо (камертай эсвэл аватараар нүүрээ нууцлах).
 * GET /api/resident/meeting
 */

import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import Switch from '../../components/UI/Switch'
import CallRoom from '../../components/Meeting/CallRoom'
import useApi from '../../hooks/useApi'
import './styles/Meeting.css'

const weekdays = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба']

const meetingAvatars = [
  { name: 'Сар', bg: '#1a1547', fg: '#ffc24b', d: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z' },
  { name: 'Од', bg: '#ffc24b', fg: '#1a1547', d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z' },
  { name: 'Уул', bg: '#ddf3e8', fg: '#135c3d', d: 'M2 20 9 8l4 6 3-4 6 10z' },
  { name: 'Гэр', bg: '#fde1dd', fg: '#8a2414', d: 'M3 13c3-5 15-5 18 0v7H3zM9 20v-4h6v4M12 4v3' },
  { name: 'Навч', bg: '#eceaf5', fg: '#2a2366', d: 'M5 19c0-9 6-14 15-15-1 9-6 15-15 15zM5 19l7-7' },
  { name: 'Нар', bg: '#ffe7b0', fg: '#7a4300', d: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5' },
]

function hhmm(d) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function AvatarIcon({ d, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

export default function Meeting() {
  const { user } = useOutletContext()

  const { data, error } = useApi('/resident/meeting', null, { fallback: null })

  const [look, setLook] = useState({ mode: 'avatar', avatar: 0, micOff: true })
  const { mode, avatar, micOff } = look

  const set = (key) => (value) => setLook((l) => ({ ...l, [key]: value }))

  const current = meetingAvatars[avatar]
  const avatarMode = mode === 'avatar'
  const modeText = avatarMode ? 'Бусдад аватар тань харагдана' : 'Бусдад нүүр тань харагдана'

  if (error) return <div className="res-meeting"><p role="alert">{error}</p></div>
  if (!data) return <div className="res-meeting"><p>Ачааллаж байна…</p></div>
  if (!data.meeting) return <div className="res-meeting"><CallRoom /></div>

  const meeting = data.meeting
  const startsAt = new Date(meeting.starts_at)
  const endsAt = new Date(meeting.ends_at)
  const started = startsAt <= new Date()
  const when = `${weekdays[startsAt.getDay()]}, ${startsAt.getMonth() + 1}-р сарын ${startsAt.getDate()} · ${hhmm(startsAt)}–${hhmm(endsAt)} · ${meeting.location}`

  return (
    <div className="res-meeting">
      <div className="mt-main">
        <CallRoom />

        <section className="mt-hero" aria-labelledby="m-title">
          <span className="mt-date">
            <span className="mt-date-month">{startsAt.getMonth() + 1}-р сар</span>
            <span className="mt-date-day">{startsAt.getDate()}</span>
          </span>
          <div className="mt-hero-text">
            <span className="mt-soon">{started ? 'Хурал явагдаж байна' : 'Удахгүй эхэлнэ'}</span>
            <h1 id="m-title">{meeting.title}</h1>
            <span className="mt-when">{when}</span>
          </div>

          <button type="button" className="mt-calendar">
            <CalendarMonthOutlined sx={{ fontSize: 18 }} /> Хуанлид нэмэх
          </button>
        </section>

        <section className="mt-agenda" aria-labelledby="ag-title">
          <h2 id="ag-title">Хэлэлцэх асуудал</h2>
          {meeting.agenda.map((a) => (
            <div key={a.id} className="mt-item">
              <span className="mt-item-n">{a.position + 1}</span>
              <span className="mt-item-text">
                <span className="mt-item-title">{a.title}</span>
                {a.description && <span className="mt-item-desc">{a.description}</span>}
              </span>
              {a.poll_id && <span className="mt-vote">Санал хураана</span>}
            </div>
          ))}
        </section>
      </div>

      <section className="mt-look" aria-labelledby="look-title">
        <h2 id="look-title">Хуралд хэрхэн харагдах вэ?</h2>

        <div className="mt-preview" role="img" aria-label={modeText}>
          {avatarMode ? (
            <span key={avatar} className="mt-preview-avatar" style={{ background: current.bg, color: current.fg }}>
              <AvatarIcon d={current.d} size={52} />
            </span>
          ) : (
            <span className="mt-preview-cam">[Камерын дүрс]</span>
          )}
          <span className="mt-preview-name">{user.name}</span>
        </div>
        <span className="mt-mode-text">{modeText}</span>

        <div className="mt-modes">
          <button type="button" aria-pressed={!avatarMode} className={avatarMode ? 'mt-mode' : 'mt-mode on'} onClick={() => set('mode')('cam')}>
            <span className="mt-mode-title">Камертай</span>
            <span className="mt-mode-hint">Нүүр харагдана</span>
          </button>
          <button type="button" aria-pressed={avatarMode} className={avatarMode ? 'mt-mode on' : 'mt-mode'} onClick={() => set('mode')('avatar')}>
            <span className="mt-mode-title">Аватартай</span>
            <span className="mt-mode-hint">Нүүрээ нууцална</span>
          </button>
        </div>

        {avatarMode && (
          <div className="mt-avatars">
            {meetingAvatars.map((a, i) => (
              <button
                key={a.name}
                type="button"
                aria-pressed={i === avatar}
                aria-label={`${a.name} аватар`}
                className={i === avatar ? 'mt-avatar on' : 'mt-avatar'}
                style={{ background: a.bg, color: a.fg }}
                onClick={() => set('avatar')(i)}
              >
                <AvatarIcon d={a.d} size={24} />
              </button>
            ))}
          </div>
        )}

        <Switch label="Микрофон унтраалттай орох" checked={micOff} onChange={set('micOff')} />
      </section>
    </div>
  )
}
