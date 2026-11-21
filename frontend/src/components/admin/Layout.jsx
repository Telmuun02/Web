import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Notifications from '../UI/Notifications'
import ChatWidget from '../Chat/ChatWidget'
import './Layout.css'

// nav bar aa duudaj bn
export default function Layout({ user, onLogout, onUserChange }) {
  return (
    <div className="layout">
      <Navbar user={user} onLogout={onLogout} />
      <main className="content">
        {/* context — хуудсууд useOutletContext()-оор user, onLogout, onUserChange (профайл засахад)-ийг авна */}
        <Outlet context={{ user, onLogout, onUserChange }} />
      </main>
      {/* Чатбот — бүх өгөгдлөөс асуух ажилтны туслах */}
      <ChatWidget userId={user.id} mode="admin" />
      {/* Realtime мэдэгдэл — шинэ хүсэлт, онлайн төлбөр */}
      <Notifications />
    </div>
  )
}
