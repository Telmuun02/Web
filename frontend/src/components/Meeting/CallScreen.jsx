/**
 * CallScreen — Zoom шиг дэлгэц дүүрэн дуудлагын цонх
 * Дээр: хурлын гарчиг, оролцогчийн тоо. Дунд: өөрийн болон бусдын видео grid. Доор: 🎤 📷 ба улаан "Дуусгах"/"Гарах" товч.
 * Props: title, media (useLocalMedia), remotes ({ id: MediaStream }), host, onLeave
 */

import CallEndOutlined from '@mui/icons-material/CallEndOutlined'
import LocalVideo from './LocalVideo'
import RemoteVideo from './RemoteVideo'
import MeetingControls from './MeetingControls'
import './Meeting.css'

export default function CallScreen({ title, media, remotes, host, onLeave }) {
  const others = Object.entries(remotes)

  return (
    <div className="call" role="dialog" aria-label={title}>
      <header className="call-top">
        <b>{title}</b>
        <span>{others.length + 1} оролцогч</span>
      </header>

      <div className="call-grid">
        <div className="call-tile">
          <LocalVideo stream={media.stream} on={!!media.video} />
          <span className="call-name">Та{host ? ' (хөтлөгч)' : ''}</span>
        </div>
        {others.map(([id, stream]) => (
          <div key={id} className="call-tile">
            <RemoteVideo stream={stream} />
            <span className="call-name">{host ? 'Оролцогч' : 'Хөтлөгч'}</span>
          </div>
        ))}
      </div>

      <footer className="call-bar">
        <MeetingControls media={media} className="meeting-controls-row">
          <button type="button" className="meeting-icon meeting-leave" aria-label={host ? 'Хурал дуусгах' : 'Хурлаас гарах'} onClick={onLeave}>
            <CallEndOutlined />
          </button>
        </MeetingControls>
      </footer>
    </div>
  )
}
