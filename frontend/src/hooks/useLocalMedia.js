/**
 * useLocalMedia — өөрийн камер, микрофон
 * Нэг MediaStream-д track нэмж/хасна. toggle('audio' | 'video'): асаалттай бол track-ийг зогсоож хасна, үгүй бол getUserMedia-аар шинээр авна.
 * stop(): бүх track-ийг унтраана (урьдчилан харахаас буцахад).
 * Буцаана: { stream, audio, video (track эсвэл null), error, toggle, stop }. Компонент устахад бүх track унтарна.
 * Хэрэглээ: const media = useLocalMedia(); <LocalVideo stream={media.stream} on={!!media.video} />
 */

import { useEffect, useState } from 'react'

const errors = {
  NotAllowedError: 'Зөвшөөрөл өгөөгүй байна. Browser-ийн хаягийн мөрөн дэх дүрс дээр дарж зөвшөөрнө үү.',
  NotFoundError: 'Төхөөрөмж олдсонгүй.',
  NotReadableError: 'Төхөөрөмжийг өөр програм ашиглаж байна.',
}

export default function useLocalMedia() {
  const [stream] = useState(() => new MediaStream())
  const [tracks, setTracks] = useState({ audio: null, video: null })
  const [error, setError] = useState('')

  async function toggle(kind) {
    setError('')
    const track = tracks[kind]
    try {
      if (track) {
        track.stop()
        stream.removeTrack(track)
        setTracks((t) => ({ ...t, [kind]: null }))
      } else {
        const [got] = (await navigator.mediaDevices.getUserMedia({ [kind]: true })).getTracks()
        stream.addTrack(got)
        setTracks((t) => ({ ...t, [kind]: got }))
      }
    } catch (err) {
      setError(errors[err.name] ?? err.message)
    }
  }

  function stop() {
    stream.getTracks().forEach((t) => {
      t.stop()
      stream.removeTrack(t)
    })
    setTracks({ audio: null, video: null })
  }

  useEffect(() => () => stream.getTracks().forEach((t) => t.stop()), [stream])

  return { stream, ...tracks, error, toggle, stop }
}
