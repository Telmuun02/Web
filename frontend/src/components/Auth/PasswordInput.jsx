import { useState } from 'react'
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import './PasswordInput.css'

// Нууц үгийн талбар — нүдний товчоор харуулж / нууж болно
export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false)

  return (
    <span className="auth-password">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="auth-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Нууц үгийг нуух' : 'Нууц үгийг харуулах'}
      >
        {visible ? <VisibilityOffOutlined sx={{ fontSize: 18 }} /> : <VisibilityOutlined sx={{ fontSize: 18 }} />}
      </button>
    </span>
  )
}
