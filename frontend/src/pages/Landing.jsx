import { Link } from 'react-router-dom'
import BuildOutlined from '@mui/icons-material/BuildOutlined'
import CampaignOutlined from '@mui/icons-material/CampaignOutlined'
import HowToVoteOutlined from '@mui/icons-material/HowToVoteOutlined'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import Brand from '../components/App/Brand'
import Avatar from '../components/UI/Avatar'
import Button from '../components/UI/Button'
import './styles/Landing.css'

const features = [
  { icon: ReceiptLongOutlined, title: 'Нэхэмжлэл ба төлбөр', text: 'Сар бүрийн нэхэмжлэл автоматаар үүсч, төлбөрөө QPay-ээр төлнө.' },
  { icon: BuildOutlined, title: 'Засварын хүсэлт', text: 'Эвдрэлээ зурагтай илгээж, засварчин хэзээ ирэхийг хянана.' },
  { icon: CampaignOutlined, title: 'Зарлал', text: 'Ус, дулаан хаагдах, хурал зэрэг мэдээг апп болон SMS-ээр авна.' },
  { icon: HowToVoteOutlined, title: 'Санал хураалт', text: 'Хотхоны шийдвэрт гэрээсээ санал өгч, дүнг шууд харна.' },
]

const steps = [
  'СӨХ-өөсөө бүртгэлээ авна — утас эсвэл имэйлээр',
  'Нууц үгээрээ нэвтэрнэ',
  'Нэхэмжлэл, хүсэлт, зарлалаа нэг дороос харна',
]

// Танилцуулга — сайт руу орход хамгийн түрүүнд гарна. Layout-ийн гадна тул navbar-гүй.
// Нэвтэрсэн бол товчнууд самбар руу, нэвтрээгүй бол нэвтрэх хуудас руу аваачна
export default function Landing({ user }) {
  const startTo = user ? '/dashboard' : '/login'

  return (
    <div className="landing">
      <header className="landing-hero">
        <nav className="landing-bar" aria-label="Танилцуулгын цэс">
          <Brand showSub={false} />
          {/* Нэвтэрсэн бол нэр нь харагдаж самбар руу, үгүй бол нэвтрэх товч */}
          {user ? (
            <Link to="/dashboard" className="landing-user" title="Самбар руу орох">
              <Avatar name={user.name} />
              <span className="landing-user-name">{user.name ?? 'Миний бүртгэл'}</span>
            </Link>
          ) : (
            <Button as={Link} to="/login">Нэвтрэх</Button>
          )}
        </nav>

        <div className="landing-intro">
          <h1>Хотхоныхоо бүх зүйлийг нэг дороос</h1>
          <p>
            СӨХ Hub — сууц өмчлөгчдийн холбооны нэхэмжлэл, төлбөр, засвар, зарлал, санал хураалтыг
            оршин суугч болон ажилтан нэг системээр удирдана.
          </p>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-features" aria-label="Боломжууд">
          {features.map((f) => (
            <div key={f.title} className="landing-feature">
              <span className="landing-feature-icon"><f.icon sx={{ fontSize: 22 }} /></span>
              <h2>{f.title}</h2>
              <p>{f.text}</p>
            </div>
          ))}
        </section>

        {/* Эхлэх хэсэг — танилцуулгын доор */}
        <section className="landing-start" aria-labelledby="start-title">
          <div className="landing-start-text">
            <h2 id="start-title">Эхлэхэд бэлэн үү?</h2>
            <ol className="landing-steps">
              {steps.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </div>
          <Button as={Link} to={startTo} variant="primary" className="landing-cta">
            {user ? 'Самбар руу орох' : 'Эхлэх'}
          </Button>
        </section>
      </main>

      <footer className="landing-footer">© 2026 СӨХ Hub</footer>
    </div>
  )
}
