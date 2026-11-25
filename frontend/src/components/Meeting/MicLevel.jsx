/**
 * MicLevel — микрофоны дууны хүчийг 4 зураасаар харуулна
 * Props: track (аудио MediaStreamTrack). AnalyserNode-оос requestAnimationFrame бүрт уншиж зураасны өндрийг ref-ээр шууд өөрчилнө (React дахин зурахгүй).
 */

import { useEffect, useRef } from 'react'
import './Meeting.css'

export default function MicLevel({ track }) {
  const barsRef = useRef(null)

  useEffect(() => {
    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 64
    ctx.createMediaStreamSource(new MediaStream([track])).connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)
    let frame
    function draw() {
      analyser.getByteFrequencyData(data)
      ;[...barsRef.current.children].forEach((bar, i) => {
        bar.style.height = `${20 + (data[i * 3] / 255) * 80}%`
      })
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(frame)
      ctx.close()
    }
  }, [track])

  return (
    <span className="mic-level" ref={barsRef} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  )
}
