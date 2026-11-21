import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Notifications from '../UI/Notifications'
import './Layout.css'

// nav bar aa duudaj bn
export default function Layout({ user, onLogout }) {
  return (
    <div className="layout">
      <Navbar user={user} onLogout={onLogout} />
      <main className="content">
        {/* context — хуудсууд useOutletContext()-оор user, onLogout-ийг авна */}
        <Outlet context={{ user, onLogout }} />
      </main>
      {/* Realtime мэдэгдэл — шинэ хүсэлт, онлайн төлбөр */}
      <Notifications />
    </div>
  )
}
