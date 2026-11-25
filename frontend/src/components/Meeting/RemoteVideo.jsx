/**
 * RemoteVideo — хурлын бусад оролцогчийн видео, дуу
 * Props: stream (RTCPeerConnection-оос ирсэн MediaStream)
 */

import { useEffect, useRef } from 'react'
import './Meeting.css'

export default function RemoteVideo({ stream }) {
  const videoRef = useRef(null)

  useEffect(() => {
    videoRef.current.srcObject = stream
  }, [stream])

  return (
    <div className="meeting-stage">
      <video ref={videoRef} className="meeting-remote" autoPlay playsInline />
    </div>
  )
}
