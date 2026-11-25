/**
 * enehuu file dotor bid navigation gee haruulah zamaar ajillaj baigaa uund
 * admin bolon user ees hamaarch ali ali item iig haruulahiig ni hiij baigaa
 * ingehdee roles deer ni admin bolon user gej uguh ba role oos ni hamaarch haragdah baidlaar hiih bolono
 * icon — MUI-ийн дүрсний компонент
 *
 * ene hesegt nav bar aa uusgeh ba <nav> ashiglah ni isActive ashiglahad amar bolgono
 */

import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import api from '../../api/client'
import Brand from '../App/Brand'
import ThemeToggle from '../../theme/ThemeToggle'
import './Navbar.css'

import BarChartOutlined from '@mui/icons-material/BarChartOutlined'
import BuildOutlined from '@mui/icons-material/BuildOutlined'
import CampaignOutlined from '@mui/icons-material/CampaignOutlined'
import ForumOutlined from '@mui/icons-material/ForumOutlined'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import HowToVoteOutlined from '@mui/icons-material/HowToVoteOutlined'
import LogoutOutlined from '@mui/icons-material/LogoutOutlined'
import PeopleOutlined from '@mui/icons-material/PeopleOutlined'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'

const menuItems = [
  { path: '/admin',               label: 'Самбар',             roles: ['admin', 'user'], icon: DashboardOutlined },
  { path: '/admin/invoices',      label: 'Нэхэмжлэл ба төлбөр', roles: ['admin', 'user'],         icon: ReceiptLongOutlined },
  { path: '/admin/requests',      label: 'Засварын хүсэлт',     roles: ['admin', 'user'], icon: BuildOutlined },
  { path: '/admin/announcements', label: 'Зарлал',              roles: ['admin', 'user'], icon: CampaignOutlined },
  { path: '/admin/polls',         label: 'Санал хураалт',       roles: ['admin', 'user'], icon: HowToVoteOutlined },
  { path: '/admin/chat',          label: 'Чат',                 roles: ['admin', 'user'], icon: ForumOutlined },
  { path: '/admin/units',         label: 'Тоот ба оршин суугч', roles: ['admin'],         icon: PeopleOutlined },
  { path: '/admin/reports',       label: 'Тайлан',              roles: ['admin', 'user'],         icon: BarChartOutlined },
  { path: '/admin/settings',      label: 'Тохиргоо',            roles: ['admin'],         icon: SettingsOutlined },
]

const iconSx = { fontSize: 18 }

export default function Navbar({ user, onLogout }) {
  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  )

  const [badges, setBadges] = useState({})

  useEffect(() => {
    if (!user) return
    api.get('/admin/requests/open-count')
      .then((res) => setBadges({ '/admin/requests': res.count }))
      .catch(() => setBadges({}))
  }, [user])

  return (
    <nav className="sidebar" aria-label="Үндсэн цэс">
      <Brand />

      {user && (
        <NavLink to="/admin/profile" className="sidebar-profile" title={user.name}>

          <span className="avatar">{user.name?.[0]?.toUpperCase()}</span>
          <span className="sidebar-profile-text">
            <span className="sidebar-profile-name">{user.name}</span>
            <span className="sidebar-profile-role">{user.role === 'admin' ? 'Админ' : 'Оршин суугч'}</span>
          </span>
        </NavLink>
      )}

      {visibleItems.map((item) => (
        <NavLink key={item.path} to={item.path} end={item.path === '/admin'} className="sidebar-link" title={item.label}>
          <item.icon sx={iconSx} />
          <span className="sidebar-label">{item.label}</span>
          {badges[item.path] > 0 && (
            <span className="sidebar-badge" aria-label={`${badges[item.path]} нээлттэй`}>{badges[item.path]}</span>
          )}
        </NavLink>
      ))}

      <ThemeToggle className="sidebar-link sidebar-theme" labelClassName="sidebar-label" />

      {user && (
        <button className="sidebar-link logout" onClick={onLogout} title="Гарах">
          <LogoutOutlined sx={iconSx} />
          <span className="sidebar-label">Гарах</span>
        </button>
      )}
    </nav>
  )
}
