/**
 * Оршин суугчийн хуудсуудын хүрээ — дээр нь header, доор нь голлосон агуулга
 */

import { Outlet } from 'react-router-dom'
import ResidentHeader from './ResidentHeader'
import ChatWidget from '../Chat/ChatWidget'
import './ResidentLayout.css'

export default function ResidentLayout({ user, onLogout, onUserChange }) {
  return (
    <div className="resident">
      <ResidentHeader user={user} />
      <main className="resident-main">

        <Outlet context={{ user, onLogout, onUserChange }} />
      </main>

      <ChatWidget userId={user.id} mode="resident" />

    </div>
  )
}
