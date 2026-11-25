/**
 * Жижиг өнгөт шошго. tone: 'green' | 'red' | 'orange' | 'yellow' | 'navy' | 'gray'
 * small — хүснэгтийн мөр доторх бүр жижиг хувилбар
 */

import './Badge.css'

export default function Badge({ tone = 'gray', small = false, children }) {
  return <span className={`ui-badge ${tone}${small ? ' small' : ''}`}>{children}</span>
}
