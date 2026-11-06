import './PageHeader.css'

// Хуудасны толгой: дээр нь жижиг тайлбар, доор нь гарчиг (h1), баруун талд товчнууд (children)
// note — гарчгийн доор нэмэлт мөр (самбарын "ШУУД · 14:03:22" гэх мэт)
export default function PageHeader({ sub, title, note, children }) {
  return (
    <header className="ui-page-head">
      <div className="ui-page-title">
        {sub && <span className="ui-page-sub">{sub}</span>}
        <h1>{title}</h1>
        {note}
      </div>
      {children && <div className="ui-page-actions">{children}</div>}
    </header>
  )
}
