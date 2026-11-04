import { Suspense } from 'react'
import Invoices from '@/views/Invoices'

export const metadata = { title: 'Нэхэмжлэл ба төлбөр · СӨХ Hub' }

// /invoices?tab=debtors — Dashboard-ийн "Бүгдийг харах"-аас ирнэ
async function InvoicesPage({ searchParams }) {
  const { tab = 'all' } = await searchParams
  return <Invoices initialTab={tab} />
}

export default function Page(props) {
  return (
    <Suspense fallback={null}>
      <InvoicesPage {...props} />
    </Suspense>
  )
}
