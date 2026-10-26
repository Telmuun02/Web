import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/App/Layout'
import Page from './components/Page'
import Dashboard from './pages/Dashboard'
import './App.css'

function App() {
  // Түр хэрэглэгч — backend-ийн нэвтрэлт бэлэн болохоор GET /api/me-ээс авна.
  // Шалгахдаа role-ыг 'admin' эсвэл 'user' болгож солино.
  const [user, setUser] = useState({ name: 'Ариунаа', role: 'admin' })

  return (
    <Routes>
      <Route path="/login" element={<Page title="Нэвтрэх" />} />

      <Route element={<Layout user={user} onLogout={() => setUser(null)} />}>
        <Route index element={<Dashboard />} />
        <Route path="invoices" element={<Page title="Нэхэмжлэл ба төлбөр" />} />
        <Route path="invoices/settings" element={<Page title="Хураамжийн тохиргоо" />} />
        <Route path="requests" element={<Page title="Засварын хүсэлт" />} />
        <Route path="announcements" element={<Page title="Зарлал" />} />
        <Route path="polls" element={<Page title="Санал хураалт" />} />
        <Route path="units" element={<Page title="Тоот ба оршин суугч" />} />
        <Route path="reports" element={<Page title="Тайлан" />} />
        <Route path="settings" element={<Page title="Тохиргоо" />} />
      </Route>

      <Route path="*" element={<Page title="Хуудас олдсонгүй" />} />
    </Routes>
  )
}

export default App
