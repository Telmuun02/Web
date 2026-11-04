'use client'

import './Tabs.css'

// Шүүлтүүрийн табууд — аль нэг нь сонгогдсон байна.
// items: [{ key: 'all', label: 'Бүгд', count: 12 }] — count өгвөл нэрийн ард бүдэг тоо гарна
// value — сонгогдсон key, onChange(key), label — табуудын нийтлэг нэр (дэлгэц уншигчид)
export default function Tabs({ items, value, onChange, label }) {
  return (
    <div className="ui-tabs" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={item.key === value}
          className={item.key === value ? 'ui-tab active' : 'ui-tab'}
          onClick={() => onChange(item.key)}
        >
          {item.label}
          {item.count != null && <span className="ui-tab-count">{item.count}</span>}
        </button>
      ))}
    </div>
  )
}
