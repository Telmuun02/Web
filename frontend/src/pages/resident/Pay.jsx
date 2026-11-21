import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined'
import Button from '../../components/UI/Button'
import PageHeader from '../../components/UI/PageHeader'
import Table from '../../components/UI/Table'
import Toast from '../../components/UI/Toast'
import api from '../../api/client'
import useApi from '../../hooks/useApi'
import { money, monthDay, monthOf } from '../../utils/format'
import './styles/Pay.css'

const historyColumns = [
  { label: 'Сар' },
  { label: 'Төлсөн огноо' },
  { label: 'Хэлбэр' },
  { label: 'Дүн', align: 'right' },
]

// payments.method → дэлгэцийн нэр
const methodNames = { qpay: 'QPay', bank: 'Дансаар', cash: 'Бэлнээр', card: 'Картаар' }

// QPay-ийн банкны товчнууд — QPay холбогдох хүртэл юу ч хийхгүй
const banks = ['Хаан', 'Голомт', 'ХХБ', 'Бусад']

const qrSize = 21 // QR код 21 × 21 нүдтэй

// Жишээ QR кодын нүднүүд — гурван буланд "харах дөрвөлжин", бусад нь хээ.
// Жинхэнэ QR биш, QPay-ийн API холбогдоход серверээс ирсэн зургаар солигдоно
function buildQr() {
  const corners = [[0, 0], [0, 14], [14, 0]]
  const cells = []
  for (let r = 0; r < qrSize; r++) {
    for (let c = 0; c < qrSize; c++) {
      const corner = corners.find(([cr, cc]) => r - cr >= -1 && r - cr <= 7 && c - cc >= -1 && c - cc <= 7)
      let on
      if (corner) {
        const br = r - corner[0]
        const bc = c - corner[1]
        const inside = br >= 0 && br <= 6 && bc >= 0 && bc <= 6
        const ring = br === 0 || br === 6 || bc === 0 || bc === 6
        const core = br >= 2 && br <= 4 && bc >= 2 && bc <= 4
        on = inside && (ring || core)
      } else {
        on = (r * 31 + c * 17 + r * c * 7) % 5 < 2
      }
      cells.push(on)
    }
  }
  return cells
}

const qrCells = buildQr()

export default function Pay() {
  const { user } = useOutletContext()
  // GET /api/resident/pay — төлсний дараа POST-ын хариугаар шууд солигдоно
  const { data: loaded, error } = useApi('/resident/pay', null, { fallback: null, live: ['invoices', 'payments'] })
  const [fresh, setFresh] = useState(null) // демо төлбөрийн дараах шинэ өгөгдөл
  const [state, setState] = useState({ sending: false, message: '' })
  const data = fresh ?? loaded

  if (error) return <div className="res-pay"><p role="alert">{error}</p></div>
  if (!data) return <div className="res-pay"><p>Ачааллаж байна…</p></div>

  const { unit, invoice, debt, entrance_light: light, history } = data
  const left = invoice ? invoice.amount - invoice.paid : 0
  const paid = Boolean(invoice) && left <= 0
  const litPercent = light.units ? Math.round((light.paid / light.units) * 100) : 0
  const month = invoice ? monthOf(invoice.period) : new Date().getMonth() + 1

  // Демо — QPay-ийн оронд үлдэгдлийг "qpay" хэлбэрээр DB-д бичнэ
  async function payDemo() {
    setState({ sending: true, message: '' })
    try {
      setFresh(await api.post('/resident/pay'))
      setState({ sending: false, message: '' })
    } catch (err) {
      setState({ sending: false, message: err.message })
    }
  }

  return (
    <div className="res-pay">
      <PageHeader
        sub={invoice ? `${month}-р сар · ${unit.code} тоот · төлөх хугацаа ${monthDay(invoice.due_date)}` : `${unit.code} тоот`}
        title="Төлбөр төлөх"
      />

      <div className="pay-top">
        {/* Задаргаа — invoice_lines хүснэгтээс */}
        <section className="pay-breakdown" aria-labelledby="bd-title">
          <h2 id="bd-title">Задаргаа</h2>
          {invoice ? (
            <>
              {invoice.lines.map((l) => (
                <div key={l.name} className="pay-line">
                  <span>{l.name}</span>
                  <span className="pay-line-amount">{money(l.amount)}</span>
                </div>
              ))}
              {invoice.paid > 0 && (
                <div className="pay-line">
                  <span>Төлсөн</span>
                  <span className="pay-line-amount">−{money(invoice.paid)}</span>
                </div>
              )}
              {debt > 0 && (
                <div className="pay-line">
                  <span>Өмнөх саруудын өр (тусад нь)</span>
                  <span className="pay-line-amount">{money(debt)}</span>
                </div>
              )}
              <div className="pay-total">
                <span>Энэ сард төлөх</span>
                <span className="pay-total-amount">{money(Math.max(left, 0))}</span>
              </div>
            </>
          ) : (
            <p>Энэ сарын нэхэмжлэл хараахан гараагүй байна.</p>
          )}
          <div className="pay-note">
            <LightbulbOutlined sx={{ fontSize: 20 }} />
            <span>Төлмөгц орцны зураг дээр таны цонх гэрэлтэнэ. Одоогоор {light.units} айлын {light.paid} нь гэрэлтэй.</span>
          </div>
        </section>

        {/* QR эсвэл "гэрэл асаалаа" */}
        <section className="pay-qpay" aria-labelledby="qr-title">
          {paid ? (
            <div className="pay-done" role="status">
              <span className="pay-done-icon" aria-hidden="true">
                <LightbulbOutlined sx={{ fontSize: 48 }} />
              </span>
              <div className="pay-done-text">
                <h2 id="qr-title">Таны гэрэл асаалаа</h2>
                <span className="pay-done-thanks">
                  Баярлалаа, {user.name}. {month}-р сарын төлбөр {money(invoice.amount)} бүрэн төлөгдлөө.
                </span>
                <span className="pay-done-light">Орц {litPercent}% гэрэлтэй · {light.units} айлын {light.paid} нь төлсөн</span>
              </div>
              <div className="pay-done-actions">
                <Button as={Link} to="/" variant="primary">Нүүр рүү буцах</Button>
              </div>
            </div>
          ) : invoice ? (
            <>
              <div className="pay-qr-row">
                <div className="pay-qr" role="img" aria-label="QPay төлбөрийн QR код">
                  {qrCells.map((on, i) => <span key={i} className={on ? 'on' : undefined} />)}
                </div>
                <div className="pay-qr-text">
                  <h2 id="qr-title">Банкны апп-аараа QR уншуулна уу</h2>
                  <span className="pay-qr-hint">Утасныхаа банкны апп-аар энэ кодыг уншуулахад дүн автоматаар бөглөгдөнө.</span>
                  <span className="pay-checking"><span className="pay-dot" aria-hidden="true" />Төлбөрийг автоматаар шалгаж байна</span>
                </div>
              </div>

              <div className="pay-banks">
                <span className="pay-qr-hint">эсвэл банкаа сонгоно уу</span>
                <div className="pay-banks-grid">
                  {/* Түр — QPay-ийн банкны линк нэмэгдэх хүртэл юу ч хийхгүй */}
                  {banks.map((b) => <button key={b} type="button" className="pay-bank">{b}</button>)}
                </div>
              </div>

              <Toast>{state.message}</Toast>
              {/* Демо — POST /api/resident/pay үлдэгдлийг QPay-ээр төлсөн гэж DB-д бичнэ */}
              <button type="button" className="pay-demo" onClick={payDemo} disabled={state.sending}>
                {state.sending ? 'Бүртгэж байна…' : `Төлсөн гэж дуурайх (демо) · ${money(left)}`}
              </button>
            </>
          ) : (
            <h2 id="qr-title">Төлөх нэхэмжлэл алга</h2>
          )}
        </section>
      </div>

      <section className="pay-history" aria-labelledby="hist-title">
        <h2 id="hist-title">Төлбөрийн түүх</h2>
        {history.length === 0 ? (
          <p>Төлбөрийн түүх алга</p>
        ) : (
          <Table columns={historyColumns} minWidth={480}>
            {history.map((h) => (
              <tr key={h.id}>
                <td className="bold">{monthOf(h.period)}-р сар</td>
                <td className="dim">{monthDay(h.paid_at)}</td>
                <td className="dim">{methodNames[h.method] ?? h.method}</td>
                <td className="num bold">{money(h.amount)}</td>
              </tr>
            ))}
          </Table>
        )}
      </section>
    </div>
  )
}
