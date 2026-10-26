import { NavLink } from 'react-router-dom'

// MUI аас татсан icon ууд
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined'
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
  { path: '/',              label: 'Самбар',              roles: ['admin', 'user'], icon: DashboardOutlined },
  { path: '/invoices',      label: 'Нэхэмжлэл ба төлбөр', roles: ['admin'],         icon: ReceiptLongOutlined },
  { path: '/requests',      label: 'Засварын хүсэлт',     roles: ['admin', 'user'], icon: BuildOutlined },
  { path: '/announcements', label: 'Зарлал',              roles: ['admin', 'user'], icon: CampaignOutlined },
  { path: '/polls',         label: 'Санал хураалт',       roles: ['admin', 'user'], icon: HowToVoteOutlined },
  { path: '/units',         label: 'Тоот ба оршин суугч', roles: ['admin'],         icon: PeopleOutlined },
  { path: '/reports',       label: 'Тайлан',              roles: ['admin'],         icon: BarChartOutlined },
  { path: '/settings',      label: 'Тохиргоо',            roles: ['admin'],         icon: SettingsOutlined },
]

const iconSx = { fontSize: 18 }

// ene hesegt nav bar aa uusgeh ba <nav> ashiglah ni isActive ashiglahad amar bolgono
export default function Navbar({ user, onLogout }) {
  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  )

  return (
    <nav className="sidebar" aria-label="Үндсэн цэс">
      <div className="brand">
        <span className="brand-logo">
          <ApartmentOutlined sx={{ fontSize: 20 }} />
        </span>
        <span className="brand-text">
          <span className="brand-name">СӨХ Hub</span>
          <span className="brand-sub">Нарны хотхон</span>
        </span>
      </div>

      {visibleItems.map((item) => (
        <NavLink key={item.path} to={item.path} end={item.path === '/'} className="sidebar-link">
          <item.icon sx={iconSx} />
          {item.label}
        </NavLink>
      ))}

      {user && (
        <button className="sidebar-link logout" onClick={onLogout}>
          <LogoutOutlined sx={iconSx} />
          Гарах
        </button>
      )}
    </nav>
  )
}
