import { Link } from 'react-router-dom'
import './CameraThumb.css'

// Камерын жижиг зураг — жинхэнэ дүрс байхгүй тул SVG-ээр энгийн дүрслэл зурна.
// camera: { name, bg, ground, obj, x1, x2 }. Нүүр болон Камер хуудсанд ашиглана
export default function CameraThumb({ camera, to = '/cameras' }) {
  return (
    <Link to={to} className="cam-thumb" aria-label={`${camera.name} камер, шууд`}>
      <svg aria-hidden="true" width="100%" height="100%" viewBox="0 0 240 150" preserveAspectRatio="xMidYMid slice">
        <rect width="240" height="150" fill={camera.bg} />
        <rect x="0" y="108" width="240" height="42" fill={camera.ground} />
        <rect x={camera.x1} y="70" width="56" height="38" rx="6" fill={camera.obj} />
        <rect x={camera.x2} y="58" width="40" height="50" rx="4" fill="#4c4870" />
        <circle cx="200" cy="30" r="12" fill="#ffc24b" opacity="0.3" />
        <circle cx="200" cy="30" r="5" fill="#ffe7b0" />
      </svg>
      <span className="cam-thumb-live"><span className="cam-thumb-dot" />ШУУД</span>
      <span className="cam-thumb-name">{camera.name}</span>
    </Link>
  )
}
