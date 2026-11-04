import { NextResponse } from 'next/server'

// Хуудас render хийгдэхээс ӨМНӨ: token cookie байхгүй бол нэвтрэх рүү (frontend-ийн Layout.jsx-ийн <Navigate>).
// Cookie хүчинтэй эсэхийг энд шалгахгүй — (app)/layout.js Express-ээс /auth/me-ээр шалгана
export function proxy(request) {
  if (!request.cookies.has('token')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

// Зөвхөн нэвтрэх шаардлагатай хаягууд
export const config = {
  matcher: [
    '/dashboard/:path*', '/invoices/:path*', '/requests/:path*', '/announcements/:path*',
    '/polls/:path*', '/units/:path*', '/reports/:path*', '/settings/:path*', '/profile/:path*',
  ],
}
