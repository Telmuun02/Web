import Link from 'next/link'
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined'
import './Brand.css'

// СӨХ Hub лого — Navbar, AuthLayout, Landing-д ашиглана.
// Дарахад танилцуулга (/) руу шилжинэ.
// showSub={false} — хотхоны нэрийг нуух (танилцуулга нь нэг хотхонд хамааралгүй)
export default function Brand({ showSub = true }) {
  return (
    <Link href="/" className="brand" aria-label="СӨХ Hub — танилцуулга руу">
      <span className="brand-logo">
        <ApartmentOutlined sx={{ fontSize: 20 }} />
      </span>
      <span className="brand-text">
        <span className="brand-name">СӨХ Hub</span>
        {showSub && <span className="brand-sub">Нарны хотхон</span>}
      </span>
    </Link>
  )
}
