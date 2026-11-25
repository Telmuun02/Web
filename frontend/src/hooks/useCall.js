/**
 * useCall — онлайн хурлын WebRTC холболт (mesh: оролцогч бүр host-той нэг RTCPeerConnection)
 * Signaling нь нийтийн WebSocket-оор (api/realtime.js send/subscribe), видео/аудио browser хооронд шууд.
 *
 * const call = useCall(media, host)   // media: useLocalMedia-ийн утга
 *   host = true (ажилтан): join({ title, entrance }) → хурал нээнэ (entrance = null бол бүх байр). Шинэ хүн орж ирэх бүрт offer илгээнэ.
 *   host = false (оршин суугч): join() → host руу орно. Ирсэн offer-т answer илгээнэ. Хурал нээгээгүй бол error.
 * Холболт бүр аудио, видео 2 transceiver-тэй. Камер/микрофоныг хурлын дунд асаах, унтраахад sync() replaceTrack хийнэ (дахин тохиролцох шаардлагагүй).
 * live: одоо явагдаж буй хурал { title, entrance } | null — холбогдоход ба хурал эхлэх/дуусахад сервер мэдэгдэнэ.
 * Буцаана: { remotes ({ id: MediaStream }), live, joined, title, error, join, leave }. Хуудаснаас гарахад автоматаар гарна.
 */

import { useEffect, useRef, useState } from 'react'
import { send, subscribe } from '../api/realtime'

const ICE = [{ urls: 'stun:stun.l.google.com:19302' }]

const notices = {
  closed: 'Хурал эхлээгүй байна. Ажилтан хурлыг эхлүүлсний дараа нэгдэнэ үү.',
  busy: 'Өөр ажилтан хурал хөтөлж байна.',
  ended: 'Хурал дууслаа.',
  offline: 'Сервертэй холбогдоогүй байна. Түр хүлээгээд дахин оролдоно уу.',
}

function sync(pc, tracks) {
  pc.getTransceivers().forEach((t) => {
    t.direction = 'sendrecv'
    t.sender.replaceTrack(tracks[t.receiver.track.kind] ?? null)
  })
}

export default function useCall(media, host) {
  const peers = useRef({})
  const local = useRef({})
  const [remotes, setRemotes] = useState({})
  const [joined, setJoined] = useState(false)
  const [title, setTitle] = useState('')
  const [live, setLive] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    local.current = { audio: media.audio, video: media.video }
    Object.values(peers.current).forEach((pc) => sync(pc, local.current))
  }, [media.audio, media.video])

  useEffect(() => {
    function drop(id) {
      peers.current[id]?.close()
      delete peers.current[id]
      setRemotes((r) => {
        const next = { ...r }
        delete next[id]
        return next
      })
    }

    function peer(id) {
      drop(id)
      const pc = new RTCPeerConnection({ iceServers: ICE })
      const remote = new MediaStream()
      pc.onicecandidate = (e) => e.candidate && send({ type: 'signal', to: id, data: { candidate: e.candidate } })
      pc.ontrack = (e) => {
        remote.addTrack(e.track)
        setRemotes((r) => ({ ...r, [id]: remote }))
      }
      peers.current[id] = pc
      return pc
    }

    async function describe(pc, id) {
      sync(pc, local.current)
      await pc.setLocalDescription()
      send({ type: 'signal', to: id, data: { description: pc.localDescription } })
    }

    async function onMessage(msg) {
      if (msg.type === 'connected') send({ type: 'status' })
      if (msg.type === 'live') setLive(msg.meeting)
      if (msg.type === 'meeting') {
        if (msg.open) return setTitle(msg.title)
        setJoined(false)
        setError(msg.busy ? notices.busy : notices.closed)
      }
      if (msg.type === 'join') {
        const pc = peer(msg.from)
        pc.addTransceiver('audio')
        pc.addTransceiver('video')
        await describe(pc, msg.from)
      }
      if (msg.type === 'signal') {
        const { description, candidate } = msg.data
        let pc = peers.current[msg.from]
        if (description?.type === 'offer') pc = peer(msg.from)
        if (description) await pc.setRemoteDescription(description)
        if (description?.type === 'offer') await describe(pc, msg.from)
        if (candidate && pc) await pc.addIceCandidate(candidate)
      }
      if (msg.type === 'left') drop(msg.from)
      if (msg.type === 'ended') {
        Object.keys(peers.current).forEach(drop)
        setJoined(false)
        setError(notices.ended)
      }
    }

    const off = subscribe((msg) => onMessage(msg).catch((err) => setError(err.message)))
    send({ type: 'status' })
    return () => {
      send({ type: 'leave' })
      Object.keys(peers.current).forEach(drop)
      off()
    }
  }, [])

  function join(meeting) {
    setError('')
    if (!send(host ? { type: 'host', ...meeting } : { type: 'join' })) return setError(notices.offline)
    if (host) setTitle(meeting.title)
    setJoined(true)
  }

  function leave() {
    send({ type: 'leave' })
    Object.values(peers.current).forEach((pc) => pc.close())
    peers.current = {}
    setRemotes({})
    setJoined(false)
  }

  return { remotes, live, joined, title, error, join, leave }
}
