import { Link, useOutletContext } from 'react-router-dom'
import AddOutlined from '@mui/icons-material/AddOutlined'
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined'
import './Dashboard.css'

// Түр өгөгдөл (дизайн дээрх жишээ) — backend бэлэн болохоор API-аас авна
const stats = [
  { label: 'Цугларсан / нэхэмжилсэн', value: '7.9 / 10.2 сая₮', note: '120 тоотоос 92 нь төлсөн', progress: 77, dark: true },
  { label: 'Төлөлтийн хувь', value: '77%', note: '11/25 хүртэл 10 хоног байна', noteClass: 'good' },
  { label: 'Хугацаа хэтэрсэн өр', value: '1.3 сая₮', note: '14 тоот · өмнөх саруудаас', valueClass: 'bad' },
  { label: 'Нээлттэй хүсэлт', value: '9', note: 'Дунджаар 19 цагт шийддэг' },
]

const months = ['12/25', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
const billed = [9.8, 9.8, 9.8, 9.8, 9.8, 10.2, 10.2, 10.2, 10.2, 10.2, 10.2, 10.2]
const collected = [9.1, 9.4, 8.8, 9.7, 9.6, 9.5, 9.0, 8.6, 9.8, 9.9, 9.6, 7.9]
const chartTop = 12 // сая₮

const debtors = [
  { unit: '1-12', name: 'Ганболд Т.', debt: '255,000₮', months: 3 },
  { unit: '3-87', name: 'Сарантуяа Б.', debt: '170,000₮', months: 2 },
  { unit: '2-31', name: 'Мөнхбат Э.', debt: '170,000₮', months: 2 },
  { unit: '1-05', name: 'Оюун Д.', debt: '92,400₮', months: 1 },
  { unit: '3-64', name: 'Тэмүүлэн Г.', debt: '85,000₮', months: 1 },
  { unit: '2-18', name: 'Нарантуяа С.', debt: '85,000₮', months: 1 },
]

const categories = [
  { name: 'Сантехник', count: 14 },
  { name: 'Цахилгаан', count: 8 },
  { name: 'Цэвэрлэгээ', count: 6 },
  { name: 'Лифт', count: 5 },
  { name: 'Бусад', count: 3 },
]
const maxCategory = Math.max(...categories.map((c) => c.count))

export default function Dashboard() {
  const { user } = useOutletContext()

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div>
          <span className="muted">Сайн байна уу, {user?.name}</span>
          <h1>2026 оны 11-р сар</h1>
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
              {months.map((m, i) => (
                <div key={m} className="bar" style={{ height: `${(billed[i] / chartTop) * 100}%` }}>
                  <div
                    className={i === months.length - 1 ? 'bar-fill current' : 'bar-fill'}
                    style={{ height: `${(collected[i] / billed[i]) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="chart-labels">
              {months.map((m) => <span key={m}>{m}</span>)}
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
                  <th>Оршин суугч</th>
                  <th className="num">Өр</th>
                  <th>Хэтэрсэн</th>
                  <th className="num">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {debtors.map((d) => (
                  <tr key={d.unit}>
                    <td className="strong">{d.unit}</td>
                    <td>{d.name}</td>
                    <td className="num strong">{d.debt}</td>
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
              <span className="muted">Энэ сард 36 хүсэлт</span>
            </div>
            {categories.map((c) => (
              <div key={c.name} className="category">
                <span>{c.name}</span>
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
