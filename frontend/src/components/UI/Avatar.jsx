/**
 * Зураг байхгүй үед нэрийн эхний үсэгтэй дугуй.
 * dark — хар хөх дэвсгэр дээр шар үсэг (ажилтан)
 */

import './Avatar.css'

export default function Avatar({ name, dark = false }) {
  return (
    <span className={dark ? 'ui-avatar dark' : 'ui-avatar'} aria-hidden="true">
      {name?.[0]?.toUpperCase()}
    </span>
  )
}
