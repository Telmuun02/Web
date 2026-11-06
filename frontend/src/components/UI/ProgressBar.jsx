import './ProgressBar.css'

// Хувь харуулах зурвас.
// value — 0–100, color — дүүргэлтийн өнгө, track — арын өнгө (хар хөх карт дээр гэх мэт), size — өндөр (px)
// marker — босго зэрэг босоо улаан зураасны байрлал (%)
// label — өгвөл дэлгэц уншигч уншина; өгөхгүй бол хажууд нь тоо бичигдсэн гэж үзээд нууна
export default function ProgressBar({ value, color = 'var(--accent)', track, size = 10, marker, label }) {
  const percent = Math.min(100, Math.max(0, value)) // 0-ээс бага, 100-аас их утгыг хязгаарлана

  return (
    <span
      className="ui-progress"
      style={{ height: size, background: track }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <span className="ui-progress-fill" style={{ width: `${percent}%`, background: color }} />
      {marker != null && <span className="ui-progress-marker" style={{ left: `${marker}%` }} />}
    </span>
  )
}
