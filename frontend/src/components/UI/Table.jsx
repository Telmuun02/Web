import './Table.css'

// Хүснэгт: толгой мөрийг columns-оос үүсгэнэ, мөрүүдийг (<tr>) children-ээр авна.
// columns: [{ label: 'Тоот' }, { label: 'Талбай', align: 'right' }, { label: 'Уншсан', width: 200 }]
// minWidth — нарийн дэлгэцэнд хүснэгт шахагдахгүй, хажуу тийш гүйлгэгдэнэ
// Нүдэнд өгч болох класс: num — баруун тийш (тоо, мөнгө), dim — саарал, bold — тод
export default function Table({ columns, minWidth = 640, children }) {
  return (
    <div className="ui-table-wrap">
      <table className="ui-table" style={{ minWidth }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.label} className={c.align === 'right' ? 'num' : undefined} style={{ width: c.width }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
