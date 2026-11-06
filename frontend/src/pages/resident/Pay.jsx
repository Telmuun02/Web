import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined'
import Button from '../../components/UI/Button'
import PageHeader from '../../components/UI/PageHeader'
import Table from '../../components/UI/Table'
// Backend-тэй түр холбоогүй — бүх өгөгдөл жишээ файлаас
import { sampleBanks, sampleEntranceLight, sampleInvoice, samplePayHistory } from '../../samples/resident/pay'
import './styles/Pay.css'

const historyColumns = [
  { label: 'Сар' },
  { label: 'Төлсөн огноо' },
  { label: 'Хэлбэр' },
  { label: 'Дүн', align: 'right' },
  { label: 'Баримт', align: 'right' },
]

const qrSize = 21 // QR код 21 × 21 нүдтэй

// 85000 → '85,000₮'
function money(n) {
  return `${n.toLocaleString('en-US')}₮`
}

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
  const [paid, setPaid] = useState(false) // Түр — QPay холбогдох хүртэл "Төлсөн гэж дуурайх" товчоор

  const total = sampleInvoice.lines.reduce((sum, l) => sum + l.amount, 0)
  const { units } = sampleEntranceLight
  const litNow = sampleEntranceLight.paid + (paid ? 1 : 0)
  const litPercent = Math.round((litNow / units) * 100)

  return (
    <div className="res-pay">
      <PageHeader sub={`${sampleInvoice.month}-р сар · ${sampleInvoice.unit} · төлөх хугацаа ${sampleInvoice.due}`} title="Төлбөр төлөх" />

      <div className="pay-top">
        {/* Задаргаа */}
        <section className="pay-breakdown" aria-labelledby="bd-title">
          <h2 id="bd-title">Задаргаа</h2>
          {sampleInvoice.lines.map((l) => (
            <div key={l.name} className="pay-line">
              <span>{l.name}</span>
              <span className="pay-line-amount">{money(l.amount)}</span>
            </div>
          ))}
          <div className="pay-total">
            <span>Нийт</span>
            <span className="pay-total-amount">{money(total)}</span>
          </div>
          <div className="pay-note">
            <LightbulbOutlined sx={{ fontSize: 20 }} />
            <span>Төлмөгц орцны зураг дээр таны цонх гэрэлтэнэ. Одоогоор {units} айлын {litNow} нь гэрэлтэй.</span>
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
                  Баярлалаа, {user.name}. {sampleInvoice.month}-р сарын төлбөр {money(total)} бүрэн төлөгдлөө.
                </span>
                <span className="pay-done-light">Орц {litPercent}% гэрэлтэй боллоо · {units} айлын {litNow} дэх нь та</span>
              </div>
              <div className="pay-done-actions">
                <Button as={Link} to="/" variant="primary">Нүүр рүү буцах</Button>
                <button type="button" className="pay-ghost" onClick={() => setPaid(false)}>Дахин үзэх</button>
              </div>
            </div>
          ) : (
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
                  {sampleBanks.map((b) => <button key={b} type="button" className="pay-bank">{b}</button>)}
                </div>
              </div>

              {/* Демо — backend байхгүй тул төлсөн мэт харагдуулна */}
              <button type="button" className="pay-demo" onClick={() => setPaid(true)}>Төлсөн гэж дуурайх (демо)</button>
            </>
          )}
        </section>
      </div>

      <section className="pay-history" aria-labelledby="hist-title">
        <h2 id="hist-title">Төлбөрийн түүх</h2>
        <Table columns={historyColumns} minWidth={560}>
          {samplePayHistory.map((h) => (
            <tr key={h.id}>
              <td className="bold">{h.month}</td>
              <td className="dim">{h.date}</td>
              <td className="dim">{h.via}</td>
              <td className="num bold">{money(h.amount)}</td>
              {/* Түр — баримт татах API нэмэгдэх хүртэл ажиллахгүй */}
              <td className="num"><Button size="small">PDF</Button></td>
            </tr>
          ))}
        </Table>
      </section>
    </div>
  )
}
