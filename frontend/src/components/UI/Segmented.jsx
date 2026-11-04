import './Segmented.css'

// Хэд хэдэн сонголтоос нэгийг сонгох (radio).
// options: [{ value: 'all', label: 'Бүх орц', note: '120 тоот' }], value, onChange(value)
// label — бүлгийн нэр (дэлгэц уншигчид)
// variant: 'fill' — саарал дэвсгэр дээр тэнцүү өргөнтэй, 'pills' — тус тусдаа хүрээтэй товчнууд
export default function Segmented({ options, value, onChange, label, variant = 'fill' }) {
  return (
    <div className={`ui-segmented ${variant}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={o.value === value ? 'ui-segment active' : 'ui-segment'}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {o.note && <span className="ui-segment-note"> · {o.note}</span>}
        </button>
      ))}
    </div>
  )
}
