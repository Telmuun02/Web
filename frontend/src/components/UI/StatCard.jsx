import './StatCard.css'

// Үзүүлэлтийн карт — нэр, том тоо, доор нь тайлбар.
// suffix — тооны ард жижиг саарал бичиг (жишээ нь '/ 120')
// tone: 'dark' — хар хөх карт, 'bad' — улаан тоо (өр гэх мэт)
// noteTone: 'good' — тайлбар ногоон
// children — тоо ба тайлбарын хооронд (жишээ нь ProgressBar)
export default function StatCard({ label, value, suffix, note, tone, noteTone, children }) {
  return (
    <div className={tone ? `ui-stat ${tone}` : 'ui-stat'}>
      <span className="ui-stat-label">{label}</span>
      <span className="ui-stat-value">
        {value}
        {suffix && <span className="ui-stat-suffix"> {suffix}</span>}
      </span>
      {children}
      {note && <span className={noteTone ? `ui-stat-note ${noteTone}` : 'ui-stat-note'}>{note}</span>}
    </div>
  )
}
