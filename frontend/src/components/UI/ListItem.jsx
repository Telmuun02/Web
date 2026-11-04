import './ListItem.css'

// Жагсаалтын мөр: зүүн талд дүрс (icon), дунд нь нэр ба тайлбар, баруун талд children (шошго, товч, утас…)
// Мөр бүрийн дээр нимгэн зураас байна
export default function ListItem({ icon, title, hint, children }) {
  return (
    <div className="ui-item">
      {icon}
      <span className="ui-item-text">
        <span className="ui-item-title">{title}</span>
        {hint && <span className="ui-item-hint">{hint}</span>}
      </span>
      {children}
    </div>
  )
}
