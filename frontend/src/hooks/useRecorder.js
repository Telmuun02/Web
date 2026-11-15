import { useEffect, useRef, useState } from 'react'

// Браузер webm/ogg-оор бичдэг — Chimege-д 16kHz, mono, 16-bit WAV хэрэгтэй тул энд хөрвүүлнэ.
// maxSeconds — үүнээс урт бол илүү хэсгийг таслана (Chimege 15 секундээс уртыг авахгүй)
async function toWav(blob, maxSeconds, rate = 16000) {
  const ctx = new AudioContext()
  const decoded = await ctx.decodeAudioData(await blob.arrayBuffer())
  ctx.close()

  // 16kHz mono болгож дахин дээжилнэ, хамгийн ихдээ maxSeconds
  const length = Math.min(Math.ceil(decoded.duration * rate), Math.floor(maxSeconds * rate))
  const offline = new OfflineAudioContext(1, length, rate)
  const source = offline.createBufferSource()
  source.buffer = decoded
  source.connect(offline.destination)
  source.start()
  const pcm = (await offline.startRendering()).getChannelData(0)

  // 44 байт WAV толгой + 16-bit дээжүүд
  const view = new DataView(new ArrayBuffer(44 + pcm.length * 2))
  const write = (offset, s) => [...s].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)))
  write(0, 'RIFF')
  view.setUint32(4, 36 + pcm.length * 2, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true) // fmt хэсгийн урт
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 2, true) // секундэд байт
  view.setUint16(32, 2, true) // дээж бүр 2 байт
  view.setUint16(34, 16, true) // 16-bit
  write(36, 'data')
  view.setUint32(40, pcm.length * 2, true)
  pcm.forEach((v, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 0x7fff, true))

  return new Blob([view], { type: 'audio/wav' })
}

// Микрофоноос дуу бичнэ (браузерын MediaRecorder).
//   recording — одоо бичиж байгаа эсэх
//   seconds   — бичиж эхэлснээс хойш өнгөрсөн секунд (таймер харуулахад)
//   start()   — микрофоны зөвшөөрөл асууж, бичиж эхэлнэ. Зөвшөөрөөгүй бол алдаа шиднэ
//   stop()    — зогсоож, бичсэн дууг WAV (16kHz, mono) Blob-оор буцаана (Promise)
//   cancel()  — зогсоож, бичсэнийг хаяна (цонх хаах үед)
// Сонголт:
//   maxSeconds — бичлэгийн дээд урт (анхдагч 15)
//   onLimit()  — maxSeconds хүрэхэд дуудагдана. Component үүн дотор stop()-оо дуудна
export function useRecorder({ maxSeconds = 15, onLimit } = {}) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const onLimitRef = useRef(onLimit)

  // Хамгийн сүүлийн onLimit-ийг ашиглана (render бүрт шинэ функц ирдэг)
  useEffect(() => {
    onLimitRef.current = onLimit
  })

  // Микрофоныг бүрэн чөлөөлнө — эс бөгөөс браузерын таб дээр "микрофон ашиглаж байна" тэмдэг үлдэнэ
  function release() {
    clearInterval(timerRef.current)
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop())
    recorderRef.current = null
    setRecording(false)
    setSeconds(0)
  }

  // Таймер — 0.25 секунд тутам шалгана. Хязгаарт хүрмэгц нэг л удаа onLimit дуудна
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

    // onstop — сүүлийн хэсэг (ondataavailable) ирсний дараа дуудагдана
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

  // Component устахад таймер, микрофоныг чөлөөлнө
  useEffect(
    () => () => {
      clearInterval(timerRef.current)
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop())
    },
    []
  )

  return { recording, seconds, maxSeconds, start, stop, cancel }
}
