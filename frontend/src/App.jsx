import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import api from './api/client'
import Layout from './components/App/Layout'
import Dashboard from './pages/Dashboard'
import Invoices from './pages/Invoices'
import Profile from './pages/Profile'
import Requests from './pages/Requests'
import Announcements from './pages/Announcements'
import Polls from './pages/Polls'
import Units from './pages/Units'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import NotFound from './pages/NotFound'
import Landing from './pages/Landing'
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
      {/* Танилцуулга — сайт руу орход хамгийн түрүүнд, navbar-гүй */}
      <Route path="/" element={<Landing user={user} />} />
      <Route path="/login" element={<Login user={user} onLogin={setUser} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<Layout user={user} onLogout={() => setUser(null)} />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="invoices" element={<Invoices />} />
        {/* Хураамжийн тохиргоо Тохиргоо хуудасны "Хураамж" хэсэгт байгаа */}
        <Route path="invoices/settings" element={<Settings />} />
        <Route path="requests" element={<Requests />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="polls" element={<Polls />} />
        <Route path="units" element={<Units />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Layout-ийн гадна — navbar-гүй 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
