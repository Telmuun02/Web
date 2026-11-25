/**
 * Бүх замууд (routes) ба нэвтэрсэн хэрэглэгч.
 * Эхлэхэд GET /api/auth/me — нэвтэрсэн эсэхийг шалгана.
 * Нэвтрээгүй: / (Landing), /login, /forgot-password, /register.
 * Ажилтан: /admin/... (Layout + RequireRole role="admin").
 * Оршин суугч: /... (ResidentLayout + RequireRole).
 * admin болон resident хуудсууд тус тусдаа өөр хуудас, layout-тай.
 * logout() - POST /api/auth/logout, хэрэглэгчийг цэвэрлэнэ
 */

import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import api from './api/client'
import { homePath } from './utils/home'
import RequireRole from './components/RequireRole'

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
import AdminChat from './pages/admin/Chat'

import ResidentLayout from './components/resident/ResidentLayout'
import Home from './pages/resident/Home'
import ResidentPay from './pages/resident/Pay'
import ResidentRequests from './pages/resident/Requests'
import ResidentMeeting from './pages/resident/Meeting'
import ResidentNews from './pages/resident/News'
import ResidentCameras from './pages/resident/Cameras'
import ResidentProfile from './pages/resident/Profile'
import ResidentChat from './pages/resident/Chat'

import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import NotFound from './pages/NotFound'
import Landing from './pages/Landing'

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
        <Route path="/forgot-password" element={<ForgotPassword mode="reset" onLogin={setUser} />} />
        <Route path="/register" element={<ForgotPassword mode="register" onLogin={setUser} />} />
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

      <Route path="/forgot-password" element={<ForgotPassword mode="reset" onLogin={setUser} />} />
      <Route path="/login" element={<Navigate to={homePath(user)} replace />} />

      <Route path="admin" element={<RequireRole user={user} role="admin" />}>
        <Route element={<Layout user={user} onLogout={logout} onUserChange={setUser} />}>
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
          <Route path="chat" element={<AdminChat />} />
        </Route>
      </Route>

      <Route element={<RequireRole user={user} role="user" />}>
        <Route element={<ResidentLayout user={user} onLogout={logout} onUserChange={setUser} />}>
          <Route index element={<Home />} />
          <Route path="pay" element={<ResidentPay />} />
          <Route path="requests" element={<ResidentRequests />} />
          <Route path="meeting" element={<ResidentMeeting />} />
          <Route path="news" element={<ResidentNews />} />
          <Route path="cameras" element={<ResidentCameras />} />
          <Route path="profile" element={<ResidentProfile />} />
          <Route path="chat" element={<ResidentChat />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
