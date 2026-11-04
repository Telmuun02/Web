import { Suspense } from 'react'
import Link from 'next/link'
import { getUser } from '../lib/serverApi'
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

// Баруун дээд булан — нэвтэрсэн бол нэр нь харагдаж самбар руу, үгүй бол нэвтрэх товч.
// Сервер дээр cookie-гоор хэрэглэгчийг уншиж HTML-д шууд бичнэ (SSR)
async function Account() {
  const user = await getUser()
  if (!user) return <Button as={Link} href="/login">Нэвтрэх</Button>

  return (
    <Link href="/dashboard" className="landing-user" title="Самбар руу орох">
      <Avatar name={user.name} />
      <span className="landing-user-name">{user.name ?? 'Миний бүртгэл'}</span>
    </Link>
  )
}

// Эхлэх товч — нэвтэрсэн бол самбар руу, нэвтрээгүй бол нэвтрэх хуудас руу
async function StartButton() {
  const user = await getUser()
  return (
    <Button as={Link} href={user ? '/dashboard' : '/login'} variant="primary" className="landing-cta">
      {user ? 'Самбар руу орох' : 'Эхлэх'}
    </Button>
  )
}

// Танилцуулга — сайт руу орход хамгийн түрүүнд гарна. Layout-ийн гадна тул navbar-гүй.
// Хэрэглэгчээс хамаарах хоёр хэсэг л <Suspense> дотор — бусад нь статик тул шууд ачаална
export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-hero">
        <nav className="landing-bar" aria-label="Танилцуулгын цэс">
          <Brand showSub={false} />
          <Suspense fallback={null}>
            <Account />
          </Suspense>
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
          <Suspense fallback={null}>
            <StartButton />
          </Suspense>
        </section>
      </main>

      <footer className="landing-footer">© 2026 СӨХ Hub</footer>
    </div>
  )
}
