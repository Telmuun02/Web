import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import api from './api/client'
import { homePath } from './utils/home'
import RequireRole from './components/RequireRole'
// Ажилтан
import Layout from './components/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import Invoices from './pages/admin/Invoices'
import Profile from './pages/admin/Profile'
import Requests from './pages/admin/Requests'
import Announcements from './pages/admin/Announcements'
import Polls from './pages/admin/Polls'
import Units from './pages/admin/Units'
import Reports from './pages/admin/Reports'
import Settings from './pages/admin/Settings'
// Оршин суугч
import ResidentLayout from './components/resident/ResidentLayout'
import Home from './pages/resident/Home'
import ResidentPay from './pages/resident/Pay'
import ResidentRequests from './pages/resident/Requests'
import ResidentMeeting from './pages/resident/Meeting'
import ResidentNews from './pages/resident/News'
import ResidentCameras from './pages/resident/Cameras'
import ResidentProfile from './pages/resident/Profile'
// Хоёулаа
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import NotFound from './pages/NotFound'
import Landing from './pages/Landing'

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

  // Шалгаж дуустал юу ч харуулахгүй — эс бөгөөс шууд /login руу шилжүүлнэ
  if (checking) return null

  // Нэвтрээгүй үед — танилцуулга, нэвтрэх, нууц үг сэргээх. Бусад бүх зам → /login
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Гарах — cookie-г серверт устгуулаад, алдаа гарсан ч дэлгэц дээр гарсан болгоно
  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      setUser(null)
    }
  }

  // Нэвтэрсэн үед — role-оор нь хоёр хэсэг
  return (
    <Routes>
      {/* Нэвтэрсэн хүн нэвтрэх хуудсанд орвол өөрийнхөө нүүр рүү */}
      <Route path="/login" element={<Navigate to={homePath(user)} replace />} />

      {/* Ажилтан — /admin/... Admin биш бол өөрийнх нь нүүр рүү буцаана */}
      <Route path="admin" element={<RequireRole user={user} role="admin" />}>
        <Route element={<Layout user={user} onLogout={logout} />}>
          <Route index element={<Dashboard />} />
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
      </Route>

      {/* Оршин суугч — /... */}
      <Route element={<RequireRole user={user} role="user" />}>
        <Route element={<ResidentLayout user={user} onLogout={logout} />}>
          <Route index element={<Home />} />
          <Route path="pay" element={<ResidentPay />} />
          <Route path="requests" element={<ResidentRequests />} />
          <Route path="meeting" element={<ResidentMeeting />} />
          <Route path="news" element={<ResidentNews />} />
          <Route path="cameras" element={<ResidentCameras />} />
          <Route path="profile" element={<ResidentProfile />} />
        </Route>
      </Route>

      {/* Layout-ийн гадна — navbar-гүй 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
