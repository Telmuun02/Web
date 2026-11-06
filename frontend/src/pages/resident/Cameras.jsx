import { useEffect, useRef, useState } from 'react'
import FullscreenOutlined from '@mui/icons-material/FullscreenOutlined'
import HistoryOutlined from '@mui/icons-material/HistoryOutlined'
import Button from '../../components/UI/Button'
import PageHeader from '../../components/UI/PageHeader'
// Backend-тэй түр холбоогүй — бүх өгөгдөл жишээ файлаас
import { sampleCameraList } from '../../samples/resident/cameras'
import './styles/Cameras.css'

export default function Cameras() {
  const [selectedId, setSelectedId] = useState(sampleCameraList[0].id)
  const [now, setNow] = useState(() => Date.now())
  const viewRef = useRef(null) // том дэлгэц — бүтэн дэлгэцээр харуулахад

  // Дүрсний баруун дээд буланд секунд тутам явах цаг
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const cam = sampleCameraList.find((c) => c.id === selectedId)

  // Browser-ийн Fullscreen API — том дүрсийг бүтэн дэлгэцээр
  function fullscreen() {
    viewRef.current?.requestFullscreen?.()
  }

  return (
    <div className="res-cameras">
      <PageHeader sub={`Нийтийн талбай · ${sampleCameraList.length} камер`} title="Камер" />

      <div className="cm-columns">
        <section className="cm-main" aria-label="Сонгосон камер">
          {/* key — камер солигдоход бүдгэрч гарч ирэх хөдөлгөөн дахин тоглоно */}
          <div key={cam.id} ref={viewRef} className="cm-view" role="img" aria-label={`${cam.name} камерын шууд дүрс`}>
            <svg aria-hidden="true" width="100%" height="100%" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice">
              <rect width="640" height="360" fill={cam.bg} />
              <rect x="0" y="250" width="640" height="110" fill={cam.ground} />
              <rect x={Math.round(cam.p * 640)} y="170" width="150" height="90" rx="14" fill={cam.obj} />
              <rect x={Math.round(cam.q * 640)} y="130" width="110" height="130" rx="8" fill="#4c4870" />
              <rect x={Math.round(cam.q * 640) + 53} y="130" width="4" height="130" fill={cam.bg} />
              <circle cx="540" cy="70" r="30" fill="#ffc24b" opacity="0.25" />
              <circle cx="540" cy="70" r="12" fill="#ffe7b0" />
              <path d="M0 360 L180 250 M640 360 L460 250" stroke="#4a4e6a" strokeWidth="3" />
            </svg>
            <span className="cm-scan" aria-hidden="true" />
            <span className="cm-live"><span className="cm-dot" />ШУУД</span>
            <span className="cm-clock">{new Date(now).toLocaleTimeString('en-GB')}</span>
            <span className="cm-name">{cam.name}</span>
          </div>

          <div className="cm-actions">
            <Button variant="dark" onClick={fullscreen}>
              <FullscreenOutlined sx={{ fontSize: 18 }} /> Бүтэн дэлгэцээр
            </Button>
            {/* Түр — бичлэгийн API нэмэгдэх хүртэл ажиллахгүй */}
            <Button>
              <HistoryOutlined sx={{ fontSize: 18 }} /> Өмнөх бичлэг
            </Button>
          </div>
          <span className="cm-note">Зөвхөн нийтийн талбайн камер харагдана. Бичлэг 7 хоног хадгалагдаж, хэн үзсэн нь бүртгэгдэнэ.</span>
        </section>

        {/* Камерын жагсаалт — дарахад том дэлгэцэнд гарна */}
        <section className="cm-list" aria-label="Камерын жагсаалт">
          {sampleCameraList.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={c.id === selectedId}
              className={c.id === selectedId ? 'cm-item on' : 'cm-item'}
              style={{ background: c.bg }}
              onClick={() => setSelectedId(c.id)}
            >
              <svg aria-hidden="true" width="100%" height="100%" viewBox="0 0 240 112" preserveAspectRatio="xMidYMid slice">
                <rect width="240" height="112" fill={c.bg} />
                <rect x="0" y="78" width="240" height="34" fill={c.ground} />
                <rect x={Math.round(c.p * 240)} y="50" width="56" height="34" rx="6" fill={c.obj} />
                <rect x={Math.round(c.q * 240)} y="36" width="40" height="48" rx="4" fill="#4c4870" />
              </svg>
              <span className="cm-item-live"><span className="cm-dot small" />ШУУД</span>
              <span className="cm-item-name">{c.name}</span>
            </button>
          ))}
        </section>
      </div>
    </div>
  )
}
