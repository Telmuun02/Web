/**
 * Нэвтрэх хуудас — /login
 * Утас (оршин суугч) эсвэл и-мэйл (ажилтан) + нууц үг, аль эрхээр нэвтрэхийг сонгоно —
 * нэг хүн хоёулаа байж болно (байрандаа амьдардаг дарга). Сүүлд сонгосныг localStorage-д санана.
 * POST /api/auth/login (cookie тавигдана) → GET /api/auth/me → өөрийн нүүр рүү
 */

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/Auth/AuthLayout'
import PasswordInput from '../components/Auth/PasswordInput'
import Segmented from '../components/UI/Segmented'
import api from '../api/client'
import { homePath } from '../utils/home'
import './styles/Auth.css'

const roles = [
  { value: 'user', label: 'Оршин суугч' },
  { value: 'admin', label: 'Ажилтан' },
]
const roleKey = 'login-as'

function savedRole() {
  try {
    return localStorage.getItem(roleKey) === 'admin' ? 'admin' : 'user'
  } catch {
    return 'user'
  }
}

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [login, setLogin] = useState(location.state?.login ?? '')
  const [password, setPassword] = useState('')
  const [as, setAs] = useState(savedRole)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const notice = location.state?.notice

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/auth/login', { login: login.trim(), password, as })
      try { localStorage.setItem(roleKey, as) } catch {}
      const me = await api.get('/auth/me')
      onLogin(me)
      navigate(homePath(me), { replace: true })
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
          <span className="auth-muted">{as === 'user' ? 'Утасны дугаар, нууц үгээрээ нэвтэрнэ үү' : 'Ажилтны имэйл хаяг, нууц үгээрээ нэвтэрнэ үү'}</span>
        </div>

        <Segmented label="Аль эрхээр нэвтрэх" options={roles} value={as} onChange={setAs} />

        {notice && !error && <div className="auth-success" role="status">{notice}</div>}
        {error && <div className="auth-error" role="alert">{error}</div>}

        <label className="auth-field">
          <span>{as === 'user' ? 'Утасны дугаар' : 'Имэйл'}</span>
          <input
            type={as === 'user' ? 'tel' : 'email'}
            inputMode={as === 'user' ? 'tel' : 'email'}
            name="login"
            autoComplete="username"
            placeholder={as === 'user' ? '99112233' : 'name@gmail.com'}
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

        {as === 'user' ? (
          <Link to="/forgot-password" state={{ login: login.trim() }} className="auth-link auth-forgot">
            Нууц үгээ мартсан?
          </Link>
        ) : (
          <span className="auth-muted auth-forgot">Нууц үгээ мартсан бол СӨХ-ийн даргад хандана уу</span>
        )}

        <button
          type="submit"
          className="auth-submit"
          disabled={submitting || !login.trim() || !password}
        >
          {submitting ? 'Нэвтэрч байна…' : 'Нэвтрэх'}
        </button>

        {as === 'user' && (
          <span className="auth-muted auth-help">
            Анх удаа юу? <Link to="/register" state={{ login: login.trim() }} className="auth-link">Утсаараа бүртгүүлэх</Link>
          </span>
        )}
      </form>
    </AuthLayout>
  )
}
