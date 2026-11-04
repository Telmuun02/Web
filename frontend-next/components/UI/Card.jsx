'use client'

import { useId } from 'react'
import './Card.css'

// Цагаан карт.
// title — h2 гарчиг, sub — гарчгийн доорх саарал тайлбар, action — баруун дээд буланд (товч гэх мэт)
// as — HTML таг: анхдагч нь <section>, хажуугийн самбарт as="aside"
// Бусад prop (aria-label, aria-labelledby…) шууд таг руу дамжина
export default function Card({ as: Tag = 'section', title, sub, action, className = '', children, ...props }) {
  const titleId = useId() // гарчгийн id — дэлгэц уншигч картыг гарчгаар нь нэрлэнэ

  return (
    <Tag className={`ui-card ${className}`.trim()} aria-labelledby={title ? titleId : undefined} {...props}>
      {(title || action) && (
        <div className="ui-card-head">
          <div className="ui-card-title">
            {title && <h2 id={titleId}>{title}</h2>}
            {sub && <span className="ui-card-sub">{sub}</span>}
          </div>
          {action}
        </div>
      )}
      {children}
    </Tag>
  )
}
