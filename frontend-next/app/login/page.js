import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Login from '@/views/Login'
import { getUser } from '@/lib/serverApi'

export const metadata = { title: 'Нэвтрэх · СӨХ Hub' }

// Нэвтэрсэн бол самбар руу; үгүй бол URL-ийн ?login=…&reset=1-ийг маягт руу дамжуулна
async function LoginPage({ searchParams }) {
  if (await getUser()) redirect('/dashboard')
  const { login = '', reset } = await searchParams
  return <Login initialLogin={login} reset={Boolean(reset)} />
}

// cookie, searchParams хүсэлт бүрт өөр тул <Suspense> дотор (cacheComponents)
export default function Page(props) {
  return (
    <Suspense fallback={null}>
      <LoginPage {...props} />
    </Suspense>
  )
}
