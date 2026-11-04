import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'

// Express-ийн хаяг — сервер дээрээс шууд хандана (browser-ийн /api rewrite-ийг биш)
const API = process.env.API_URL ?? 'http://localhost:3000'

/**
 * getUser -- нэвтэрсэн хэрэглэгч эсвэл null. frontend-ийн App.jsx дахь /auth/me-ийн оронд.
 * Browser-ийн "token" cookie-г Express руу дамжуулна.
 * cache() — нэг хүсэлтийн дотор хэд дуудсан ч Express руу ганц удаа хандана.
 * cookies() уншдаг тул дуудаж буй бүрэлдэхүүн <Suspense> дотор байх ёстой (cacheComponents)
 */
export const getUser = cache(async () => {
  const token = (await cookies()).get('token')
  if (!token) return null

  try {
    const res = await fetch(`${API}/api/auth/me`, {
      headers: { Cookie: `token=${token.value}` },
    })
    return res.ok ? await res.json() : null
  } catch {
    return null // backend асаагүй бол нэвтрээгүй гэж үзнэ
  }
})
