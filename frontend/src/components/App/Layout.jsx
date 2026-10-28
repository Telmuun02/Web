import { Navigate, Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import './Layout.css'

// nav bar aa duudaj bn
export default function Layout({ user, onLogout }) {
  // Нэвтрээгүй бол login руу — Layout доторх бүх хуудас ингэж хамгаалагдана
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="layout">
      <Navbar user={user} onLogout={onLogout} />
      <main className="content">
        {/* context — хуудсууд useOutletContext()-оор user-ийг авна */}
        <Outlet context={{ user }} />
      </main>
    </div>
  )
}
