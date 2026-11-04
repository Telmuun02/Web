import './Field.css'

// Нэртэй талбар: <label> дотор нэр ба input/select/textarea (children).
// Label дотор байгаа тул нэр дээр дарахад талбар идэвхжиж, дэлгэц уншигч нэрийг нь уншина
export default function Field({ label, className = '', children }) {
  return (
    <label className={`ui-field ${className}`.trim()}>
      {label}
      {children}
    </label>
  )
}
