'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import api from '../../api/client'
import Brand from './Brand'
import './Navbar.css'

// MUI аас татсан icon ууд
import BarChartOutlined from '@mui/icons-material/BarChartOutlined'
import BuildOutlined from '@mui/icons-material/BuildOutlined'
import CampaignOutlined from '@mui/icons-material/CampaignOutlined'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import HowToVoteOutlined from '@mui/icons-material/HowToVoteOutlined'
import LogoutOutlined from '@mui/icons-material/LogoutOutlined'
import PeopleOutlined from '@mui/icons-material/PeopleOutlined'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'

// enehuu file dotor bid navigation gee haruulah zamaar ajillaj baigaa uund
// admin bolon user ees hamaarch ali ali item iig haruulahiig ni hiij baigaa

// ingehdee roles deer ni admin bolon user gej uguh ba role oos ni hamaarch haragdah baidlaar hiih bolono
// icon — MUI-ийн дүрсний компонент
const menuItems = [
  { path: '/dashboard',     label: 'Самбар',             roles: ['admin', 'user'], icon: DashboardOutlined },
  { path: '/invoices',      label: 'Нэхэмжлэл ба төлбөр', roles: ['admin', 'user'],         icon: ReceiptLongOutlined },
  { path: '/requests',      label: 'Засварын хүсэлт',     roles: ['admin', 'user'], icon: BuildOutlined },
  { path: '/announcements', label: 'Зарлал',              roles: ['admin', 'user'], icon: CampaignOutlined },
  { path: '/polls',         label: 'Санал хураалт',       roles: ['admin', 'user'], icon: HowToVoteOutlined },
  { path: '/units',         label: 'Тоот ба оршин суугч', roles: ['admin'],         icon: PeopleOutlined },
  { path: '/reports',       label: 'Тайлан',              roles: ['admin', 'user'],         icon: BarChartOutlined },
  { path: '/settings',      label: 'Тохиргоо',            roles: ['admin'],         icon: SettingsOutlined },
]

const iconSx = { fontSize: 18 }

// ene hesegt nav bar aa uusgeh ba <nav> ashiglah ni isActive ashiglahad amar bolgono
export default function Navbar({ user, onLogout }) {
  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  )

  // Цэсний тоонууд — замаар нь: { '/requests': 7 }
  const [badges, setBadges] = useState({})

  // react-router-ийн NavLink шиг: тухайн зам эсвэл түүний дэд зам дээр байвал "active"
  // (/invoices/settings дээр "Нэхэмжлэл" идэвхтэй харагдана)
  const pathname = usePathname()
  function isActive(path) {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  function linkProps(path, className) {
    const active = isActive(path)
    return {
      href: path,
      className: active ? `${className} active` : className,
      'aria-current': active ? 'page' : undefined,
    }
  }

  // Нэвтэрсэн үед нээлттэй засварын хүсэлтийн тоог авна. Алдаа гарвал тоо харуулахгүй л болно
  useEffect(() => {
    if (!user) return
    api.get('/requests/open-count')
      .then((res) => setBadges({ '/requests': res.count }))
      .catch(() => setBadges({}))
  }, [user])

  return (
    // Хулгана гадна байхад зөвхөн icon, дээр нь очиход CSS (:hover) бүтэн дэлгэнэ
    <nav className="sidebar" aria-label="Үндсэн цэс">
      <Brand />

      {user && (
        <Link {...linkProps('/profile', 'sidebar-profile')} title={user.name}>
          {/* Зураг байхгүй тул нэрийн эхний үсэг */}
          <span className="avatar">{user.name?.[0]?.toUpperCase()}</span>
          <span className="sidebar-profile-text">
            <span className="sidebar-profile-name">{user.name}</span>
            <span className="sidebar-profile-role">{user.role === 'admin' ? 'Админ' : 'Оршин суугч'}</span>
          </span>
        </Link>
      )}

      {visibleItems.map((item) => (
        // title — хумигдсан үед хулганаа барихад нэр нь харагдана
        <Link key={item.path} {...linkProps(item.path, 'sidebar-link')} title={item.label}>
          <item.icon sx={iconSx} />
          <span className="sidebar-label">{item.label}</span>
          {badges[item.path] > 0 && (
            <span className="sidebar-badge" aria-label={`${badges[item.path]} нээлттэй`}>{badges[item.path]}</span>
          )}
        </Link>
      ))}

      {user && (
        <button className="sidebar-link logout" onClick={onLogout} title="Гарах">
          <LogoutOutlined sx={iconSx} />
          <span className="sidebar-label">Гарах</span>
        </button>
      )}
    </nav>
  )
}
