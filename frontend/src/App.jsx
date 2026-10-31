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

  return (
    <Routes>
      <Route path="/login" element={<Login user={user} onLogin={setUser} />} />
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
