/**
 * Хурал (ажилтан) — /admin/meeting
 * Онлайн хурлын өрөө: өөрийн камерын дүрс (LocalVideo), хажууд нь товчнууд (MeetingControls), камер/микрофон useLocalMedia-аар.
 * Камер зөвхөн localhost эсвэл https дээр ажиллана. Хуудаснаас гарахад бүх track унтарна.
 */

import { useState } from 'react'
import PageHeader from '../../components/UI/PageHeader'
import LocalVideo from '../../components/Meeting/LocalVideo'
import MeetingControls from '../../components/Meeting/MeetingControls'
import useLocalMedia from '../../hooks/useLocalMedia'
import './styles/Meeting.css'

export default function Meeting() {
  const media = useLocalMedia()
  const [joined, setJoined] = useState(false)

  return (
    <div className="meeting">
      <PageHeader sub="Оршин суугчдын онлайн хурал" title="Хурал" />

      <div className="meeting-room">
        <LocalVideo stream={media.stream} on={!!media.video} />
        <MeetingControls media={media} joined={joined} onJoin={() => setJoined(true)} onLeave={() => setJoined(false)} />
      </div>

      {media.error && <p className="meeting-error" role="alert">{media.error}</p>}
    </div>
  )
}
