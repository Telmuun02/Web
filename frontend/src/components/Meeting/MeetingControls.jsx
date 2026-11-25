/**
 * MeetingControls — хурлын товчнууд (босоо багана)
 * Микрофон (хажууд нь MicLevel), камер дүрстэй товч, "Нэгдэх" / улаан "Гарах" товч.
 * Props: media (useLocalMedia-ийн утга), joined, onJoin, onLeave
 */

import VideocamOutlined from '@mui/icons-material/VideocamOutlined'
import VideocamOffOutlined from '@mui/icons-material/VideocamOffOutlined'
import MicOutlined from '@mui/icons-material/MicOutlined'
import MicOffOutlined from '@mui/icons-material/MicOffOutlined'
import CallEndOutlined from '@mui/icons-material/CallEndOutlined'
import Button from '../UI/Button'
import MicLevel from './MicLevel'
import './Meeting.css'

export default function MeetingControls({ media, joined, onJoin, onLeave }) {
  return (
    <div className="meeting-controls">
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
      {joined ? (
        <button type="button" className="meeting-icon meeting-leave" aria-label="Хурлаас гарах" onClick={onLeave}>
          <CallEndOutlined />
        </button>
      ) : (
        <Button variant="primary" onClick={onJoin}>Нэгдэх</Button>
      )}
    </div>
  )
}
