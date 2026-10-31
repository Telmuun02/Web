import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import AddOutlined from '@mui/icons-material/AddOutlined'
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined'
import api from '../api/client'
import './styles/Dashboard.css'

const chartTop = 12 // сая₮ — графикийн дээд хязгаар

// 7900000 → '7.9'. Утга ирээгүй бол 0
function million(n) {
  return ((n || 0) / 1000000).toFixed(1)
}

// /api/dashboard-ийн хариунаас дээд талын 4 карт.
// Хэсэг нь ирээгүй (backend хуучин хувилбартай гэх мэт) бол = {}, талбар нь байхгүй бол ?? 0
function buildStats({ collection = {}, overdue = {}, requests = {} }) {
  return [
    {
      label: 'Цугларсан / нэхэмжилсэн',
      value: `${million(collection.collected)} / ${million(collection.billed)} сая₮`,
      note: `${collection.units ?? 0} тоотоос ${collection.paid_units ?? 0} нь төлсөн`,
      progress: collection.percent ?? 0,
      dark: true,
    },
    { label: 'Төлөлтийн хувь', value: `${collection.percent ?? 0}%`, note: 'Энэ сарын нэхэмжлэлээс', noteClass: 'good' },
    { label: 'Хугацаа хэтэрсэн өр', value: `${million(overdue.debt)} сая₮`, note: `${overdue.units ?? 0} тоот · өмнөх саруудаас`, valueClass: 'bad' },
    {
      label: 'Нээлттэй хүсэлт',
      value: `${requests.open ?? 0}`,
      // Шийдсэн хүсэлт байхгүй бол дундаж тооцоологдохгүй (null)
      note: requests.avg_hours != null ? `Дунджаар ${requests.avg_hours} цагт шийддэг` : 'Шийдсэн хүсэлт алга',
    },
  ]
}

// Backend-ийн ангиллын нэр → харуулах нэр (requests.category enum)
const categoryLabels = {
  plumbing: 'Сантехник',
  electrical: 'Цахилгаан',
  cleaning: 'Цэвэрлэгээ',
  elevator: 'Лифт',
  other: 'Бусад',
}

export default function Dashboard() {
  const { user } = useOutletContext()
  const [data, setData] = useState(null)
  const [chart, setChart] = useState([])
  const [debtors, setDebtors] = useState([])
  const [categories, setCategories] = useState([])

  // Хуудас нээгдэхэд самбарын өгөгдлийг татна
  useEffect(() => {
    api.get('/dashboard').then(setData)
  }, [])

  // 12 сарын график — тусдаа API
  useEffect(() => {
    api.get('/dashboard/monthly').then(setChart)
  }, [])

  // Өр ихтэй тоотууд — тусдаа API
  useEffect(() => {
    api.get('/dashboard/debtors', { params: { limit: 6 } }).then(setDebtors)
  }, [])

  // Энэ сарын хүсэлт ангиллаар — тусдаа API
  useEffect(() => {
    api.get('/dashboard/categories').then(setCategories)
  }, [])

  // Мөрийн уртыг хамгийн их ангилалтай харьцуулж бодно. Хоосон үед 0-д хуваахгүйн тулд 1
  const maxCategory = Math.max(1, ...categories.map((c) => c.count))
  const totalRequests = categories.reduce((sum, c) => sum + c.count, 0)
  // '2026-10-01' → ['2026', '10', '01']
  const [year, month] = data?.period ? data.period.split('-') : []

  // Backend ₮-өөр өгнө, buildStats сая болгож харуулна. Өгөгдөл ирэх хүртэл хоосон
  const stats = data ? buildStats(data) : []

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div>
          <span className="muted">Сайн байна уу, {user?.name}</span>
          <h1>{year ? `${year} оны ${Number(month)}-р сар` : '…'}</h1>
        </div>
        <div className="dash-actions">
          <label className="field">
            <span className="muted">Байр</span>
            <select>
              <option>Бүгд (3 орц)</option>
              <option>1-р орц</option>
              <option>2-р орц</option>
              <option>3-р орц</option>
            </select>
          </label>
          <button className="btn">
            <FileDownloadOutlined sx={{ fontSize: 16 }} /> Excel татах
          </button>
          <button className="btn btn-primary">
            <AddOutlined sx={{ fontSize: 16 }} /> Зарлал нийтлэх
          </button>
        </div>
      </header>

      <div className="stats">
        {stats.map((s) => (
          <div key={s.label} className={s.dark ? 'card stat dark' : 'card stat'}>
            <span className="stat-label">{s.label}</span>
            <span className={`stat-value ${s.valueClass ?? ''}`}>{s.value}</span>
            {s.progress != null && (
              <span className="progress"><span style={{ width: `${s.progress}%` }} /></span>
            )}
            <span className={`stat-note ${s.noteClass ?? ''}`}>{s.note}</span>
          </div>
        ))}
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Сүүлийн 12 сарын орлого</h2>
            <span className="muted">Тав дахь сараас хураамж 9.8 → 10.2 сая₮ болсон; 11-р сар явж байна</span>
          </div>
          <div className="legend">
            <span><i className="swatch billed" />Нэхэмжилсэн</span>
            <span><i className="swatch collected" />Цугларсан</span>
          </div>
        </div>
        <div className="chart">
          <div className="chart-axis" aria-hidden="true">
            <span>12 сая</span><span>8</span><span>4</span><span>0</span>
          </div>
          <div className="chart-body" role="img" aria-label="12 сарын нэхэмжилсэн ба цугларсан дүнгийн баганан график">
            <div className="chart-bars">
              {chart.map((c, i) => (
                <div key={c.period} className="bar" style={{ height: `${(c.billed / 1000000 / chartTop) * 100}%` }}>
                  <div
                    className={i === chart.length - 1 ? 'bar-fill current' : 'bar-fill'}
                    style={{ height: `${c.billed ? (c.collected / c.billed) * 100 : 0}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="chart-labels">
              {/* '2026-10-01' → 10 */}
              {chart.map((c) => <span key={c.period}>{Number(c.period.split('-')[1])}</span>)}
            </div>
          </div>
        </div>
      </section>

      <div className="dash-row">
        <section className="card debtors">
          <div className="card-head">
            <h2>Өр ихтэй тоотууд</h2>
            <Link to="/invoices" className="link">Бүгдийг харах →</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Тоот</th>
                  <th>Орц / давхар</th>
                  <th className="num">Өр</th>
                  <th>Хэтэрсэн</th>
                  <th className="num">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {debtors.map((d) => (
                  <tr key={d.unit_id}>
                    <td className="strong">{d.code}</td>
                    <td>{d.entrance}-р орц, {d.floor} давхар</td>
                    {/* 170000 → '170,000₮' */}
                    <td className="num strong">{d.debt.toLocaleString('en-US')}₮</td>
                    <td><span className={d.months >= 2 ? 'pill bad' : 'pill warn'}>{d.months} сар</span></td>
                    <td className="num"><button className="btn btn-small">SMS сануулах</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="dash-side">
          <section className="card">
            <div>
              <h2>Хүсэлт ангиллаар</h2>
              <span className="muted">Энэ сард {totalRequests} хүсэлт</span>
            </div>
            {categories.map((c) => (
              <div key={c.category} className="category">
                <span>{categoryLabels[c.category] ?? c.category}</span>
                <span className="category-track">
                  <span style={{ width: `${(c.count / maxCategory) * 100}%` }} />
                </span>
                <span className="strong num">{c.count}</span>
              </div>
            ))}
          </section>

          <Link to="/polls" className="poll-card">
            <span className="poll-tag">Идэвхтэй санал хураалт · 11/20 дуусна</span>
            <span className="poll-title">Тоглоомын талбайг шинэчлэх үү?</span>
            <span className="poll-note">Ирц 46% · босго 50% хүртэл 5 тоот дутуу</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
