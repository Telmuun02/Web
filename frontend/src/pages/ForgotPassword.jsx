import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined'
import AuthLayout from '../components/Auth/AuthLayout'
import PasswordInput from '../components/Auth/PasswordInput'
import { requestPasswordReset, resetPassword } from '../api/auth'
import './styles/Auth.css'

const RESEND_SECONDS = 60
const MIN_PASSWORD = 8

// 2 алхам: 1) имэйл/утас оруулж код авах  2) код + шинэ нууц үг
export default function ForgotPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState('request')
  const [login, setLogin] = useState(location.state?.login ?? '')
  const [channel, setChannel] = useState('sms')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Код дахин илгээх хүртэлх секунд тоолуур
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function sendCode() {
    setError('')
    setSubmitting(true)
    try {
      const result = await requestPasswordReset(login.trim())
      setChannel(result.channel)
      setStep('reset')
      setCooldown(RESEND_SECONDS)
    } catch (err) {
      setError(err.message || 'Код илгээж чадсангүй, дахин оролдоно уу')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRequest(e) {
    e.preventDefault()
    await sendCode()
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')

    if (password.length < MIN_PASSWORD) {
      setError(`Нууц үг дор хаяж ${MIN_PASSWORD} тэмдэгт байх ёстой`)
      return
    }
    if (password !== confirm) {
      setError('Нууц үг таарахгүй байна')
      return
    }

    setSubmitting(true)
    try {
      await resetPassword({ login: login.trim(), code, password })
      navigate('/login', {
        replace: true,
        state: { login: login.trim(), notice: 'Нууц үг амжилттай солигдлоо. Шинэ нууц үгээрээ нэвтэрнэ үү.' },
      })
    } catch (err) {
      setError(err.message || 'Нууц үг сольж чадсангүй')
      setSubmitting(false)
    }
  }

  function changeLogin() {
    setStep('request')
    setCode('')
    setError('')
  }

  return (
    <AuthLayout>
      {step === 'request' ? (
        <form className="auth-card" onSubmit={handleRequest} noValidate>
          <Link to="/login" className="auth-back">
            <ArrowBackOutlined sx={{ fontSize: 16 }} /> Нэвтрэх рүү буцах
          </Link>

          <div className="auth-head">
            <h2>Нууц үг сэргээх</h2>
            <span className="auth-muted">
              Бүртгэлтэй имэйл эсвэл утасны дугаараа оруулбал баталгаажуулах код илгээнэ.
            </span>
          </div>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <label className="auth-field">
            <span>Имэйл эсвэл утас</span>
            <input
              type="text"
              name="login"
              autoComplete="username"
              placeholder="99112233"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              autoFocus
            />
          </label>

          <button type="submit" className="auth-submit" disabled={submitting || !login.trim()}>
            {submitting ? 'Илгээж байна…' : 'Код илгээх'}
          </button>
        </form>
      ) : (
        <form className="auth-card" onSubmit={handleReset} noValidate>
          <button type="button" className="auth-back" onClick={changeLogin}>
            <ArrowBackOutlined sx={{ fontSize: 16 }} /> Өөр хаяг оруулах
          </button>

          <div className="auth-head">
            <h2>Шинэ нууц үг</h2>
            <span className="auth-muted">
              Хэрэв <strong>{login.trim()}</strong> бүртгэлтэй бол{' '}
              {channel === 'email' ? 'имэйлээр' : 'SMS-ээр'} 6 оронтой код илгээлээ.
            </span>
          </div>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <label className="auth-field">
            <span>Баталгаажуулах код</span>
            <input
              type="text"
              name="code"
              className="auth-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus
            />
          </label>

          <label className="auth-field">
            <span>Шинэ нууц үг</span>
            <PasswordInput
              name="new-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="auth-hint">Дор хаяж {MIN_PASSWORD} тэмдэгт</span>
          </label>

          <label className="auth-field">
            <span>Шинэ нууц үг давтах</span>
            <PasswordInput
              name="confirm-password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            className="auth-submit"
            disabled={submitting || code.length !== 6 || !password || !confirm}
          >
            {submitting ? 'Хадгалж байна…' : 'Нууц үг солих'}
          </button>

          <span className="auth-muted auth-help">
            Код ирээгүй юу?{' '}
            {cooldown > 0 ? (
              <span>{cooldown} секундын дараа дахин илгээх боломжтой</span>
            ) : (
              <button type="button" className="auth-link" onClick={sendCode} disabled={submitting}>
                Дахин илгээх
              </button>
            )}
          </span>
        </form>
      )}
    </AuthLayout>
  )
}
