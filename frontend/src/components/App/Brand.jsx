import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined'
import './Brand.css'

// СӨХ Hub лого — Navbar болон AuthLayout-д ашиглана
export default function Brand() {
  return (
    <div className="brand">
      <span className="brand-logo">
        <ApartmentOutlined sx={{ fontSize: 20 }} />
      </span>
      <span className="brand-text">
        <span className="brand-name">СӨХ Hub</span>
        <span className="brand-sub">Нарны хотхон</span>
      </span>
    </div>
  )
}
