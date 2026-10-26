import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

// nav bar aa duudaj bn
export default function Layout({ user, onLogout }) {
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
