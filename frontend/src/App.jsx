import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import api from './api/client'
import Layout from './components/App/Layout'
import Page from './components/Page'
import Dashboard from './pages/Dashboard'
import Invoices from './pages/Invoices'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  // Апп ачаалагдахад (F5 дарсан ч) cookie хүчинтэй эсэхийг серверээс асууна
  useEffect(() => {
    api.get('/auth/me')
      .then((me) => setUser(me))
      .catch(() => setUser(null))
      .finally(() => setChecking(false))
  }, [])

  // Шалгаж дуустал юу ч харуулахгүй — эс бөгөөс Layout шууд /login руу шилжүүлнэ
  if (checking) return null

  return (
    <Routes>
      <Route path="/login" element={<Login user={user} onLogin={setUser} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<Layout user={user} onLogout={() => setUser(null)} />}>
        <Route index element={<Dashboard />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/settings" element={<Page title="Хураамжийн тохиргоо" />} />
        <Route path="requests" element={<Page title="Засварын хүсэлт" />} />
        <Route path="announcements" element={<Page title="Зарлал" />} />
        <Route path="polls" element={<Page title="Санал хураалт" />} />
        <Route path="units" element={<Page title="Тоот ба оршин суугч" />} />
        <Route path="reports" element={<Page title="Тайлан" />} />
        <Route path="settings" element={<Page title="Тохиргоо" />} />
        <Route path="profile" element={<Page title="Миний профайл" />} />
      </Route>

      <Route path="*" element={<Page title="Хуудас олдсонгүй" />} />
    </Routes>
  )
}

export default App
