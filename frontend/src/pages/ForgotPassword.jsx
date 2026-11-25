/**
 * Утсаар бүртгүүлэх / нууц үг сэргээх — verify.mn (reverse SMS):
 *   1) утас → POST /api/auth/verify → код ба 144773 дугаар
 *   2) хэрэглэгч өөрийн утаснаас кодоо 144773 руу SMS-ээр илгээнэ, бид 3 сек тутам шалгана
 *   3) баталгаажмагц нууц үг тохируулна → POST /api/auth/verify/:id/complete
 *      тоотод холбогдсон бол шууд нэвтэрнэ, үгүй бол СӨХ тоотод холбохыг хүлээнэ (pending)
 * mode: 'register' (/register) | 'reset' (/forgot-password) — урсгал нь адилхан, бичиг нь өөр
 */

import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined'
import SmsOutlined from '@mui/icons-material/SmsOutlined'
import AuthLayout from '../components/Auth/AuthLayout'
import PasswordInput from '../components/Auth/PasswordInput'
import api from '../api/client'
import { homePath } from '../utils/home'
import './styles/Auth.css'

const MIN_PASSWORD = 8
const POLL_MS = 3000

const texts = {
  register: { title: 'Бүртгүүлэх', lead: 'Утасны дугаараа оруулна уу. Утсаа SMS-ээр баталгаажуулаад нууц үгээ тохируулна.' },
  reset: { title: 'Нууц үг сэргээх', lead: 'Бүртгэлтэй утасны дугаараа оруулна уу. Утсаа баталгаажуулаад шинэ нууц үг тохируулна.' },
}

export default function ForgotPassword({ mode = 'reset', onLogin }) {
  const navigate = useNavigate()
  const location = useLocation()
  const t = texts[mode]
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState(location.state?.login ?? '')
  const [session, setSession] = useState(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (step !== 'sms' || !session) return
    const tick = setInterval(() => setNow(Date.now()), 1000)
    const poll = setInterval(async () => {
      try {
        const { status, activated } = await api.get(`/auth/verify/${session.id}`)
        if (status === 'verified') {
          setSession((s) => ({ ...s, activated }))
          setStep('password')
          setError('')
        } else if (status === 'expired') {
          setStep('phone')
          setError('Хугацаа дууссан. Дахин код авна уу.')
        }
      } catch {
      }
    }, POLL_MS)
    return () => {
      clearInterval(tick)
      clearInterval(poll)
    }
  }, [step, session])

  async function start(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const created = await api.post('/auth/verify', { phone: phone.trim() })
      setSession(created)
      setNow(Date.now())
      setStep('sms')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function complete(e) {
    e.preventDefault()
    setError('')
    if (password.length < MIN_PASSWORD) return setError(`Нууц үг дор хаяж ${MIN_PASSWORD} тэмдэгт байх ёстой`)
    if (password !== confirm) return setError('Нууц үг таарахгүй байна')

    setSubmitting(true)
    try {
      const result = await api.post(`/auth/verify/${session.id}/complete`, { password })
      if (result.pending) {
        setStep('pending')
        setSubmitting(false)
        return
      }
      const me = await api.get('/auth/me')
      onLogin?.(me)
      navigate(homePath(me), { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const secondsLeft = session ? Math.max(0, Math.floor((new Date(session.expiresAt) - now) / 1000)) : 0
  const countdown = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`

  return (
    <AuthLayout>
      {step === 'phone' && (
        <form className="auth-card" onSubmit={start} noValidate>
          <Link to="/login" className="auth-back">
            <ArrowBackOutlined sx={{ fontSize: 16 }} /> Нэвтрэх рүү буцах
          </Link>
          <div className="auth-head">
            <h2>{t.title}</h2>
            <span className="auth-muted">{t.lead}</span>
          </div>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <label className="auth-field">
            <span>Утасны дугаар</span>
            <input
              type="tel"
              name="phone"
              inputMode="tel"
              autoComplete="tel"
              placeholder="99112233"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoFocus
            />
            <span className="auth-hint">Бүртгүүлсний дараа СӨХ таныг тоотод тань холбоно</span>
          </label>

          <button type="submit" className="auth-submit" disabled={submitting || !phone.trim()}>
            {submitting ? 'Түр хүлээнэ үү…' : 'Код авах'}
          </button>
        </form>
      )}

      {step === 'sms' && session && (
        <div className="auth-card">
          <button type="button" className="auth-back" onClick={() => setStep('phone')}>
            <ArrowBackOutlined sx={{ fontSize: 16 }} /> Өөр дугаар оруулах
          </button>
          <div className="auth-head">
            <h2>Утсаа баталгаажуулна уу</h2>
            <span className="auth-muted">
              <strong>{phone.trim()}</strong> дугаараасаа <strong>{session.shortcode}</strong> руу доорх кодыг SMS-ээр илгээнэ үү.
            </span>
          </div>

          <div className="auth-sms-code" aria-label={`Илгээх код ${session.code}`}>{session.code}</div>

          <a className="auth-submit auth-sms-btn" href={session.smsUri}>
            <SmsOutlined sx={{ fontSize: 20 }} /> SMS илгээх
          </a>

          <span className="auth-muted auth-help" role="status" aria-live="polite">
            <span className="auth-waiting" aria-hidden="true" /> Таны SMS-ийг хүлээж байна · {countdown}
          </span>
          <span className="auth-hint">
            Оператор 150₮ авна. 2 SIM-тэй бол бүртгэлтэй дугаарын SIM-ээ сонгоно уу. Утсан дээрээ "SMS илгээх" дарвал мессеж бэлэн бичигдсэн нээгдэнэ.
          </span>
        </div>
      )}

      {step === 'password' && (
        <form className="auth-card" onSubmit={complete} noValidate>
          <div className="auth-head">
            <h2>{session?.activated ? 'Шинэ нууц үг' : 'Нууц үг тохируулах'}</h2>
            <span className="auth-muted">Утас баталгаажлаа ✓ Одоо нэвтрэх нууц үгээ оруулна уу.</span>
          </div>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <label className="auth-field">
            <span>Нууц үг</span>
            <PasswordInput name="new-password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
            <span className="auth-hint">Дор хаяж {MIN_PASSWORD} тэмдэгт</span>
          </label>

          <label className="auth-field">
            <span>Нууц үг давтах</span>
            <PasswordInput name="confirm-password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </label>

          <button type="submit" className="auth-submit" disabled={submitting || !password || !confirm}>
            {submitting ? 'Хадгалж байна…' : 'Хадгалаад нэвтрэх'}
          </button>
        </form>
      )}
      {step === 'pending' && (
        <div className="auth-card">
          <div className="auth-head">
            <h2>Бүртгэл үүслээ ✓</h2>
            <span className="auth-muted">
              <strong>{phone.trim()}</strong> дугаар баталгаажлаа. СӨХ-ийн ажилтан таныг тоотод тань холбосны дараа
              энэ утас, нууц үгээрээ нэвтэрнэ. Хурдан холбуулахыг хүсвэл СӨХ-д тоотоо хэлээрэй.
            </span>
          </div>
          <Link to="/login" state={{ login: phone.trim() }} className="auth-submit auth-sms-btn">Нэвтрэх хуудас руу</Link>
        </div>
      )}
    </AuthLayout>
  )
}
