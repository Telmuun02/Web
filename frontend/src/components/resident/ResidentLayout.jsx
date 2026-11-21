import { Outlet } from 'react-router-dom'
import ResidentHeader from './ResidentHeader'
import ChatWidget from './ChatWidget'
import Notifications from '../UI/Notifications'
import './ResidentLayout.css'

// Оршин суугчийн хуудсуудын хүрээ — дээр нь header, доор нь голлосон агуулга
export default function ResidentLayout({ user, onLogout }) {
  return (
    <div className="resident">
      <ResidentHeader user={user} />
      <main className="resident-main">
        {/* context — хуудсууд useOutletContext()-оор user, onLogout-ийг авна */}
        <Outlet context={{ user, onLogout }} />
      </main>
      {/* Чатбот — баруун доод буланд, бүх оршин суугчийн хуудсанд */}
      <ChatWidget userId={user.id} />
      {/* Realtime мэдэгдэл — хүсэлтийн төлөв, зарлал, нэхэмжлэл, төлбөр */}
      <Notifications />
    </div>
  )
}
