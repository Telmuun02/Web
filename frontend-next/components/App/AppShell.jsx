'use client'

import { createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import api from '../../api/client'
import Navbar from './Navbar'
import './Layout.css'

// frontend-ийн Layout.jsx + useOutletContext()-ийн оронд.
// Хэрэглэгчийг сервер (app/(app)/layout.js) аваад энд дамжуулна, хуудсууд useAppContext()-оор авна
const AppContext = createContext(null)

export function useAppContext() {
  return useContext(AppContext)
}

export default function AppShell({ user, children }) {
  const router = useRouter()

  // Гарах — cookie-г серверт устгуулаад нэвтрэх хуудас руу.
  // refresh() — сервер бүрэлдэхүүнүүд cookie-гүй болсныг мэдэж дахин render хийнэ
  async function onLogout() {
    try {
      await api.post('/auth/logout')
    } finally {
      router.replace('/login')
      router.refresh()
    }
  }

  return (
    <AppContext.Provider value={{ user, onLogout }}>
      <div className="layout">
        <Navbar user={user} onLogout={onLogout} />
        <main className="content">{children}</main>
      </div>
    </AppContext.Provider>
  )
}
