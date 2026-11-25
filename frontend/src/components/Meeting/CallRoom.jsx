/**
 * CallRoom — онлайн хурал (ажилтан, оршин суугч хоёулаа)
 * host: HostStart (гарчиг, бүх байр / орц) → урьдчилан харах (камер, 🎤 📷, доор нь "Эхлүүлэх") → CallScreen. Дуусгахад маягт руу буцна.
 * Оршин суугч: явагдаж буй хурлын карт → дарахад урьдчилан харах (камер, 🎤 📷, "Нэгдэх", "Буцах") → CallScreen. Хурал алга бол мэдэгдэл.
 * useLocalMedia (камер, микрофон) + useCall (WebRTC холболт, live хурал)
 */

import { useState } from 'react'
import LocalVideo from './LocalVideo'
import MeetingControls from './MeetingControls'
import HostStart from './HostStart'
import CallScreen from './CallScreen'
import Button from '../UI/Button'
import useLocalMedia from '../../hooks/useLocalMedia'
import useCall from '../../hooks/useCall'
import './Meeting.css'

const scopeLabel = (entrance) => (entrance ? `${entrance}-р орцны хурал` : 'Бүх байрны хурал')

export default function CallRoom({ host }) {
  const media = useLocalMedia()
  const call = useCall(media, host)
  const [setup, setSetup] = useState(null)
  const [lobby, setLobby] = useState(false)
  const error = media.error || call.error
  const alert = error && <p className="meeting-error" role="alert">{error}</p>

  function leave() {
    call.leave()
    if (host) setSetup(null)
  }

  function back() {
    media.stop()
    if (host) setSetup(null)
    else setLobby(false)
  }

  if (call.joined) {
    return <CallScreen title={call.title} media={media} remotes={call.remotes} host={host} onLeave={leave} />
  }

  if (host && !setup) {
    return (
      <div className="meeting-call">
        <HostStart onStart={setSetup} />
        {alert}
      </div>
    )
  }

  const meeting = host ? setup : call.live

  if (!host && !lobby) {
    return (
      <div className="meeting-call">
        {meeting ? (
          <button type="button" className="meeting-live meeting-live-card" onClick={() => setLobby(true)}>
            <span className="meeting-live-dot">Хурал явагдаж байна</span>
            <b>{meeting.title}</b>
            <span>{scopeLabel(meeting.entrance)}</span>
            <span className="meeting-live-go">Орох →</span>
          </button>
        ) : (
          <p className="meeting-none">Одоогоор явагдаж буй хурал алга. Ажилтан хурал эхлүүлэхэд энд харагдана.</p>
        )}
        {alert}
      </div>
    )
  }

  return (
    <div className="meeting-call">
      {meeting ? (
        <div className="meeting-live">
          {!host && <span className="meeting-live-dot">Хурал явагдаж байна</span>}
          <b>{meeting.title}</b>
          <span>{scopeLabel(meeting.entrance)}</span>
        </div>
      ) : (
        <p className="meeting-none">Одоогоор явагдаж буй хурал алга. Ажилтан хурал эхлүүлэхэд энд харагдана.</p>
      )}
      <div className="meeting-room">
        <div className="meeting-grid">
          <LocalVideo stream={media.stream} on={!!media.video} />
        </div>
        <MeetingControls media={media} />
      </div>
      <div className="meeting-actions">
        <Button variant="primary" disabled={!meeting} onClick={() => call.join(setup)}>{host ? 'Эхлүүлэх' : 'Нэгдэх'}</Button>
        <Button onClick={back}>Буцах</Button>
      </div>
      {alert}
    </div>
  )
}
