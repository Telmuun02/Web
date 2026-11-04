import BuildOutlined from '@mui/icons-material/BuildOutlined'
import HowToVoteOutlined from '@mui/icons-material/HowToVoteOutlined'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import Brand from '../App/Brand'
import './AuthLayout.css'

// Нэвтрэх, нууц үг сэргээх хуудсуудын нийтлэг хүрээ — зүүн талд navy хэсэг, баруун талд form
const features = [
  { icon: ReceiptLongOutlined, text: 'Нэхэмжлэл, төлбөрөө шалгах' },
  { icon: BuildOutlined, text: 'Засварын хүсэлт илгээх' },
  { icon: HowToVoteOutlined, text: 'Санал хураалтад оролцох' },
]

export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <aside className="auth-hero">
        <Brand />

        <div className="auth-hero-body">
          <h1>Хотхоныхоо бүх зүйлийг нэг дороос</h1>
          <ul className="auth-features">
            {features.map((f) => (
              <li key={f.text}>
                <span className="auth-feature-icon"><f.icon sx={{ fontSize: 18 }} /></span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <span className="auth-footnote">© 2026 СӨХ Hub</span>
      </aside>

      <main className="auth-main">{children}</main>
    </div>
  )
}
