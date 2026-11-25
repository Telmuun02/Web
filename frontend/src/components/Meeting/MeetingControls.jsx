/**
 * MeetingControls — микрофон (хажууд нь MicLevel), камерын дүрстэй товчнууд
 * Props: media (useLocalMedia-ийн утга), className (байрлал: босоо багана эсвэл дуудлагын доод мөр), children (нэмэлт товч, жишээ нь "Дуусгах")
 */

import VideocamOutlined from '@mui/icons-material/VideocamOutlined'
import VideocamOffOutlined from '@mui/icons-material/VideocamOffOutlined'
import MicOutlined from '@mui/icons-material/MicOutlined'
import MicOffOutlined from '@mui/icons-material/MicOffOutlined'
import MicLevel from './MicLevel'
import './Meeting.css'

export default function MeetingControls({ media, className = '', children }) {
  return (
    <div className={`meeting-controls ${className}`}>
      <div className="meeting-mic">
        <button
          type="button"
          className="meeting-icon"
          aria-label={media.audio ? 'Микрофон унтраах' : 'Микрофон асаах'}
          aria-pressed={!!media.audio}
          onClick={() => media.toggle('audio')}
        >
          {media.audio ? <MicOutlined /> : <MicOffOutlined />}
        </button>
        {media.audio && <MicLevel track={media.audio} />}
      </div>
      <button
        type="button"
        className="meeting-icon"
        aria-label={media.video ? 'Камер унтраах' : 'Камер асаах'}
        aria-pressed={!!media.video}
        onClick={() => media.toggle('video')}
      >
        {media.video ? <VideocamOutlined /> : <VideocamOffOutlined />}
      </button>
      {children}
    </div>
  )
}
