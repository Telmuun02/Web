/**
 * Микрофоноос дуу бичнэ (браузерын MediaRecorder).
 * Браузер webm/ogg-оор бичдэг — Chimege-д 16kHz, mono, 16-bit WAV хэрэгтэй тул энд хөрвүүлнэ.
 *   recording — одоо бичиж байгаа эсэх
 *   seconds   — бичиж эхэлснээс хойш өнгөрсөн секунд
 *   start()   — микрофоны зөвшөөрөл асууж, бичиж эхэлнэ. Зөвшөөрөөгүй бол алдаа шиднэ
 *   stop()    — зогсоож, WAV Blob буцаана (Promise)
 *   cancel()  — зогсоож, бичсэнийг хаяна
 * Сонголт: maxSeconds — дээд урт (анхдагч 15, Chimege түүнээс уртыг авахгүй), onLimit() — хүрэхэд дуудагдана
 */

import { useEffect, useRef, useState } from 'react'

async function toWav(blob, maxSeconds, rate = 16000) {
  const ctx = new AudioContext()
  const decoded = await ctx.decodeAudioData(await blob.arrayBuffer())
  ctx.close()

  const length = Math.min(Math.ceil(decoded.duration * rate), Math.floor(maxSeconds * rate))
  const offline = new OfflineAudioContext(1, length, rate)
  const source = offline.createBufferSource()
  source.buffer = decoded
  source.connect(offline.destination)
  source.start()
  const pcm = (await offline.startRendering()).getChannelData(0)

  const view = new DataView(new ArrayBuffer(44 + pcm.length * 2))
  const write = (offset, s) => [...s].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)))
  write(0, 'RIFF')
  view.setUint32(4, 36 + pcm.length * 2, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, pcm.length * 2, true)
  pcm.forEach((v, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 0x7fff, true))

  return new Blob([view], { type: 'audio/wav' })
}

export function useRecorder({ maxSeconds = 15, onLimit } = {}) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const onLimitRef = useRef(onLimit)

  useEffect(() => {
    onLimitRef.current = onLimit
  })

  function release() {
    clearInterval(timerRef.current)
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop())
    recorderRef.current = null
    setRecording(false)
    setSeconds(0)
  }

  function startTimer() {
    const startedAt = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000
      setSeconds(Math.min(Math.floor(elapsed), maxSeconds))
      if (elapsed >= maxSeconds) {
        clearInterval(timerRef.current)
        onLimitRef.current?.()
      }
    }, 250)
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      throw new Error('Таны браузер дуу бичихийг дэмжихгүй байна')
    }

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      throw new Error('Микрофоны зөвшөөрөл өгөөгүй байна')
    }

    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data)
    }
    recorder.start()
    recorderRef.current = recorder
    setRecording(true)
    startTimer()
  }

  function stop() {
    const recorder = recorderRef.current
    if (!recorder) return Promise.resolve(null)

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        release()
        if (!blob.size) return resolve(null)
        toWav(blob, maxSeconds).then(resolve, () => reject(new Error('Бичлэгийг боловсруулж чадсангүй')))
      }
      clearInterval(timerRef.current)
      recorder.stop()
    })
  }

  function cancel() {
    const recorder = recorderRef.current
    if (!recorder) return
    recorder.onstop = null
    recorder.stop()
    release()
  }

  useEffect(
    () => () => {
      clearInterval(timerRef.current)
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop())
    },
    []
  )

  return { recording, seconds, maxSeconds, start, stop, cancel }
}
