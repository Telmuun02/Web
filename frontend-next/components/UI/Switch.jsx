'use client'

import ListItem from './ListItem'
import './Switch.css'

// Асаах/унтраах мөр — ListItem-ийн баруун талд товч нэмсэн.
// role="switch" + aria-checked — дэлгэц уншигч асаалттай эсэхийг хэлнэ
export default function Switch({ label, hint, checked, onChange }) {
  return (
    <ListItem title={label} hint={hint}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={checked ? 'ui-switch on' : 'ui-switch'}
        onClick={() => onChange(!checked)}
      >
        <span className="ui-switch-knob" />
      </button>
    </ListItem>
  )
}
