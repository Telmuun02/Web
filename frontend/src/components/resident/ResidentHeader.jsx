import { NavLink } from 'react-router-dom'
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined'
import Brand from '../App/Brand'
import './ResidentHeader.css'

// Оршин суугчийн дээд цэс. NavLink — идэвхтэй хуудсанд "active" класс, aria-current="page" өөрөө тавина
const menuItems = [
  { path: '/', label: 'Нүүр' },
  { path: '/pay', label: 'Төлбөр' },
  { path: '/requests', label: 'Хүсэлт' },
  { path: '/meeting', label: 'Хурал' },
  { path: '/news', label: 'Зарлал' },
  { path: '/cameras', label: 'Камер' },
]

export default function ResidentHeader({ user }) {
  const unread = 2 // Түр — мэдэгдлийн API нэмэгдэх хүртэл жишээ тоо

  return (
    <header className="res-header">
      <div className="res-header-inner">
        <Brand />

        <nav className="res-nav" aria-label="Үндсэн цэс">
          {menuItems.map((item) => (
            // end — "/" нь бусад бүх замын эхлэл тул зөвхөн яг "/" үед идэвхтэй
            <NavLink key={item.path} to={item.path} end={item.path === '/'} className="res-nav-link">
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="res-header-actions">
          {/* Түр — мэдэгдлийн жагсаалт нэмэгдэх хүртэл юу ч нээхгүй */}
          <button type="button" className="res-bell" aria-label={`Мэдэгдэл, ${unread} уншаагүй`}>
            <NotificationsNoneOutlined sx={{ fontSize: 22 }} />
            {unread > 0 && <span className="res-bell-count" aria-hidden="true">{unread}</span>}
          </button>

          <NavLink to="/profile" className="res-profile">
            <span className="res-avatar" aria-hidden="true">{user.name?.[0]?.toUpperCase()}</span>
            <span className="res-profile-name">{user.name}</span>
          </NavLink>
        </div>
      </div>
    </header>
  )
}
