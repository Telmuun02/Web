'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthLayout from '../components/Auth/AuthLayout'
import PasswordInput from '../components/Auth/PasswordInput'
import api from '../api/client'
import './styles/Auth.css'

// app/login/page.js сервер дээр URL-аас уншиж дамжуулна: /login?login=99112233&reset=1
// (react-router-ийн location.state-ийн оронд). Нэвтэрсэн хэрэглэгчийг тэр page /dashboard руу шилжүүлнэ
export default function Login({ initialLogin = '', reset = false }) {
  const router = useRouter()
  const [login, setLogin] = useState(initialLogin)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Нууц үг сэргээсний дараа ирсэн бол амжилтын мессеж харуулна
  const notice = reset ? 'Нууц үг амжилттай солигдлоо. Шинэ нууц үгээрээ нэвтэрнэ үү.' : ''

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/auth/login', { login: login.trim(), password }) // cookie тавигдана
      // refresh() — сервер бүрэлдэхүүнүүд шинэ cookie-гоор хэрэглэгчийг дахин уншина
      router.replace('/dashboard')
      router.refresh()
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

        <Link href={`/forgot-password?login=${encodeURIComponent(login.trim())}`} className="auth-link auth-forgot">
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
