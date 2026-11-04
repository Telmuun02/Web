import { Link } from 'react-router-dom'
import './styles/NotFound.css'

// 404 — байхгүй хаяг руу орход гарна.
// App.jsx-д Layout-ийн гадна байрладаг тул navbar гарахгүй
export default function NotFound() {
  return (
    <main className="notfound">
      <span className="notfound-code" aria-hidden="true">404</span>
      <h1>Хуудас олдсонгүй</h1>
      <p>Таны хайсан хуудас устсан, нэр нь өөрчлөгдсөн эсвэл хаяг буруу бичигдсэн байж магадгүй.</p>
      <Link to="/" className="notfound-link">Нүүр хуудас руу буцах</Link>
    </main>
  )
}
