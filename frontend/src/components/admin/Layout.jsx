/**
 * Ажилтны хуудсуудын хүрээ — зүүн талд Navbar, баруун талд хуудас (Outlet), чатбот.
 * Хуудсууд useOutletContext()-оор user, onLogout, onUserChange-ийг авна
 */

import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import ChatWidget from '../Chat/ChatWidget'
import './Layout.css'

export default function Layout({ user, onLogout, onUserChange }) {
  return (
    <div className="layout">
      <Navbar user={user} onLogout={onLogout} />
      <main className="content">

        <Outlet context={{ user, onLogout, onUserChange }} />
      </main>

      <ChatWidget userId={user.id} mode="admin" />

    </div>
  )
}
