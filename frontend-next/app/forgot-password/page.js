import { Suspense } from 'react'
import ForgotPassword from '@/views/ForgotPassword'

export const metadata = { title: 'Нууц үг сэргээх · СӨХ Hub' }

async function ForgotPasswordPage({ searchParams }) {
  const { login = '' } = await searchParams
  return <ForgotPassword initialLogin={login} />
}

export default function Page(props) {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordPage {...props} />
    </Suspense>
  )
}
