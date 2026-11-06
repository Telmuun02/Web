import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import VideocamOutlined from '@mui/icons-material/VideocamOutlined'
import Switch from '../../components/UI/Switch'
import Toast from '../../components/UI/Toast'
// Backend-тэй түр холбоогүй — бүх өгөгдөл жишээ файлаас
import { meetingAvatars, sampleMeeting } from '../../samples/resident/meeting'
import './styles/Meeting.css'

// Аватарын дүрс — SVG замаас
function AvatarIcon({ d, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

export default function Meeting() {
  const { user } = useOutletContext()
  const [mode, setMode] = useState('avatar') // 'avatar' — нүүрээ нууцлах, 'cam' — камертай
  const [avatar, setAvatar] = useState(0)
  const [micOff, setMicOff] = useState(true)
  const [toast, setToast] = useState('')

  const current = meetingAvatars[avatar]
  const avatarMode = mode === 'avatar'
  const modeText = avatarMode ? 'Бусдад аватар тань харагдана' : 'Бусдад нүүр тань харагдана'

  return (
    <div className="res-meeting">
      <div className="mt-main">
        {/* Хурлын товч мэдээлэл */}
        <section className="mt-hero" aria-labelledby="m-title">
          <span className="mt-date">
            <span className="mt-date-month">{sampleMeeting.month}-р сар</span>
            <span className="mt-date-day">{sampleMeeting.day}</span>
          </span>
          <div className="mt-hero-text">
            <span className="mt-soon">Удахгүй эхэлнэ · {sampleMeeting.registered} айл бүртгүүлсэн</span>
            <h1 id="m-title">{sampleMeeting.title}</h1>
            <span className="mt-when">{sampleMeeting.when}</span>
          </div>
          {/* Түр — хуанлийн файл (.ics) үүсгэх хүртэл ажиллахгүй */}
          <button type="button" className="mt-calendar">
            <CalendarMonthOutlined sx={{ fontSize: 18 }} /> Хуанлид нэмэх
          </button>
        </section>

        {/* Хэлэлцэх асуудал */}
        <section className="mt-agenda" aria-labelledby="ag-title">
          <h2 id="ag-title">Хэлэлцэх асуудал</h2>
          {sampleMeeting.agenda.map((a) => (
            <div key={a.n} className="mt-item">
              <span className="mt-item-n">{a.n}</span>
              <span className="mt-item-text">
                <span className="mt-item-title">{a.title}</span>
                <span className="mt-item-desc">{a.desc}</span>
              </span>
              {a.vote && <span className="mt-vote">Санал хураана</span>}
            </div>
          ))}
        </section>
      </div>

      {/* Хуралд хэрхэн харагдах */}
      <section className="mt-look" aria-labelledby="look-title">
        <h2 id="look-title">Хуралд хэрхэн харагдах вэ?</h2>

        <div className="mt-preview" role="img" aria-label={modeText}>
          {avatarMode ? (
            // key — аватар солигдоход "үсрэх" хөдөлгөөн дахин тоглоно
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
          <button type="button" aria-pressed={!avatarMode} className={avatarMode ? 'mt-mode' : 'mt-mode on'} onClick={() => setMode('cam')}>
            <span className="mt-mode-title">Камертай</span>
            <span className="mt-mode-hint">Нүүр харагдана</span>
          </button>
          <button type="button" aria-pressed={avatarMode} className={avatarMode ? 'mt-mode on' : 'mt-mode'} onClick={() => setMode('avatar')}>
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
                onClick={() => setAvatar(i)}
              >
                <AvatarIcon d={a.d} size={24} />
              </button>
            ))}
          </div>
        )}

        <Switch label="Микрофон унтраалттай орох" checked={micOff} onChange={setMicOff} />

        <Toast>{toast}</Toast>

        {/* Түр — хурлын өрөө (видео) хийгдэх хүртэл зөвхөн мэдэгдэл харуулна */}
        <button type="button" className="mt-join" onClick={() => setToast(`Хурал ${sampleMeeting.month}/${sampleMeeting.day}-нд 19:00 цагт нээгдэнэ`)}>
          <VideocamOutlined sx={{ fontSize: 22 }} /> Хуралд нэгдэх
        </button>
      </section>
    </div>
  )
}
