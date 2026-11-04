import './PageHeader.css'

// Хуудасны толгой: дээр нь жижиг тайлбар, доор нь гарчиг (h1), баруун талд товчнууд (children)
export default function PageHeader({ sub, title, children }) {
  return (
    <header className="ui-page-head">
      <div className="ui-page-title">
        {sub && <span className="ui-page-sub">{sub}</span>}
        <h1>{title}</h1>
      </div>
      {children && <div className="ui-page-actions">{children}</div>}
    </header>
  )
}
