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

// admin болон resident хуудсууд тус тусад нь үүсгэсэн.
// тус тусдаа өөр өөр хуудас болон layout ууд тай

function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    api.get('/auth/me')
      .then((me) => setUser(me))
      .catch(() => setUser(null))
      .finally(() => setChecking(false))
  }, [])

  if (checking) return null

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

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      setUser(null)
    }
  }

  return (
    <Routes>
      {/**login huudas */}
      <Route path="/login" element={<Navigate to={homePath(user)} replace />} />

      {/**admin huudas */}
      <Route path="admin" element={<RequireRole user={user} role="admin" />}>
        <Route element={<Layout user={user} onLogout={logout} />}>
          <Route index element={<Dashboard />} />
          <Route path="invoices" element={<Invoices />} />
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

      {/**orshin suugchiin huudas */}
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

      {/** Not Found huudas */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
