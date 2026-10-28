import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/Auth/AuthLayout'
import PasswordInput from '../components/Auth/PasswordInput'
import './styles/Auth.css'

export default function Login({ user, onLogin }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [login, setLogin] = useState(location.state?.login ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Нууц үг сэргээсний дараа ирсэн бол амжилтын мессеж харуулна
  const notice = location.state?.notice

  // Нэвтэрсэн хэрэглэгч энэ хуудсанд орвол самбар руу буцаана
  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await onLogin({ login: login.trim(), password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Нэвтрэх нэр эсвэл нууц үг буруу байна')
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div className="auth-head">
          <h2>Нэвтрэх</h2>
          <span className="auth-muted">Имэйл эсвэл утасны дугаараа оруулна уу</span>
        </div>

        {notice && !error && <div className="auth-success" role="status">{notice}</div>}
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
            autoFocus={!login}
          />
        </label>

        <label className="auth-field">
          <span>Нууц үг</span>
          <PasswordInput
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus={!!login}
          />
        </label>

        <Link to="/forgot-password" state={{ login: login.trim() }} className="auth-link auth-forgot">
          Нууц үгээ мартсан?
        </Link>

        <button
          type="submit"
          className="auth-submit"
          disabled={submitting || !login.trim() || !password}
        >
          {submitting ? 'Нэвтэрч байна…' : 'Нэвтрэх'}
        </button>
      </form>
    </AuthLayout>
  )
}
