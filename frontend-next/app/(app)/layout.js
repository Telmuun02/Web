import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import AppShell from '@/components/App/AppShell'
import { getUser } from '@/lib/serverApi'

// Хэрэглэгчийг сервер дээр аваад Navbar-тай бүрхүүлд дамжуулна.
// Cookie хугацаа нь дууссан бол (proxy.js cookie байгаа эсэхийг л шалгадаг) нэвтрэх рүү
async function Shell({ children }) {
  const user = await getUser()
  if (!user) redirect('/login')
  return <AppShell user={user}>{children}</AppShell>
}

// (app) — хаалттай нэр URL-д орохгүй: /dashboard, /invoices … Navbar-тай бүх хуудас
export default function AppLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <Shell>{children}</Shell>
    </Suspense>
  )
}
