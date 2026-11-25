/**
 * LocalVideo — өөрийн камерын дүрс (толин тусгал байдлаар)
 * Props: stream (MediaStream), on (камер асаалттай эсэх). Track нэмэгдэх бүрт srcObject-ийг дахин онооно.
 */

import { useEffect, useRef } from 'react'
import './Meeting.css'

export default function LocalVideo({ stream, on }) {
  const videoRef = useRef(null)

  useEffect(() => {
    videoRef.current.srcObject = stream
  }, [stream, on])

  return (
    <div className="meeting-stage">
      <video ref={videoRef} className="meeting-video" autoPlay playsInline muted hidden={!on} />
      {!on && <p className="meeting-off">Камер унтраалттай</p>}
    </div>
  )
}
