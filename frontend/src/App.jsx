import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/App/Layout'
import Page from './components/Page'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import './App.css'

function App() {
  const [user, setUser] = useState(null)

  // Түр нэвтрэлт — backend бэлэн болохоор POST /api/auth/login руу илгээнэ.
  // Одоохондоо ямар ч нэр, нууц үгээр нэвтэрнэ; role-ыг 'admin' эсвэл 'user' болгож шалгана.
  async function handleLogin({ login }) {
    setUser({ name: 'Ариунаа', login, role: 'admin' })
  }

  return (
    <Routes>
      <Route path="/login" element={<Login user={user} onLogin={handleLogin} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

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
