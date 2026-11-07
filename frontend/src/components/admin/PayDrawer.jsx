import CloseOutlined from '@mui/icons-material/CloseOutlined'
import Button from '../UI/Button'
import Field from '../UI/Field'
import './PayDrawer.css'

// 85000 → '85,000₮'
function money(n) {
  return `${n.toLocaleString('en-US')}₮`
}

// Төлбөр бүртгэх цонх — баруун талаас гарна.
// invoice: { unit, name, period, total, paid }
// onSave({ amount, method, note }) — "Бүртгэх" дарахад, onClose — хаахад.
// State байхгүй — талбаруудын утгыг "Бүртгэх" дарах мөчид form-оос (FormData) уншина
export default function PayDrawer({ invoice, onClose, onSave }) {
  const left = invoice.total - invoice.paid // үлдэгдэл

  function save(e) {
    e.preventDefault() // хуудас дахин ачааллахгүй
    const data = new FormData(e.target)
    onSave({
      amount: Number(data.get('amount')),
      method: data.get('method'),
      note: data.get('note'),
    })
  }

  return (
    <div className="pay-overlay" onClick={onClose}>
      {/* stopPropagation — цонхны дотор дарахад хаагдахгүй */}
      <form
        className="pay-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={save}
      >
        <div className="pay-head">
          <div>
            <h2 id="pay-title">Төлбөр бүртгэх</h2>
            <span className="pay-muted">{invoice.unit} тоот · {invoice.name} · {invoice.period}</span>
          </div>
          <button type="button" className="pay-close" onClick={onClose} aria-label="Хаах">
            <CloseOutlined sx={{ fontSize: 20 }} />
          </button>
        </div>

        <div className="pay-left">
          <span className="pay-muted">Үлдэгдэл</span>
          <span className="pay-left-value">{money(left)}</span>
        </div>

        {/* min/max — 0 эсвэл үлдэгдлээс их дүнг браузер өөрөө зогсооно */}
        <Field label="Төлсөн дүн (₮)">
          <input name="amount" type="number" min="1" max={left} step="1" defaultValue={left} required />
        </Field>

        <Field label="Төлбөрийн хэлбэр">
          <select name="method" defaultValue="cash">
            <option value="cash">Бэлэн мөнгө</option>
            <option value="bank">Дансаар шилжүүлсэн</option>
          </select>
        </Field>

        <Field label="Тэмдэглэл">
          <textarea name="note" rows="3" placeholder="Жишээ: жижүүрийн өрөөнд хүлээж авсан" />
        </Field>

        <span className="pay-hint">
          Бүртгэсэн төлбөрийг устгах боломжгүй; алдаатай бол буцаалт бичлэг нэмнэ.
        </span>

        <div className="pay-actions">
          <Button type="button" onClick={onClose}>Цуцлах</Button>
          <Button type="submit" variant="dark">Бүртгэх</Button>
        </div>
      </form>
    </div>
  )
}
