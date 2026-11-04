import { Onest, Unbounded } from 'next/font/google'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import './index.css'
import './App.css'

// frontend/index.html-ийн Google Fonts <link>-ийн оронд — фонт өөрийн серверээс ачаалагдана.
// Хоёулаа variable фонт тул weight заах шаардлагагүй. CSS-д var(--font-onest), var(--font-unbounded)-оор ашиглана
const onest = Onest({ subsets: ['latin', 'cyrillic'], variable: '--font-onest' })
const unbounded = Unbounded({ subsets: ['latin', 'cyrillic'], variable: '--font-unbounded' })

export const metadata = {
  title: 'СӨХ Hub',
  description: 'Сууц өмчлөгчдийн холбооны нэхэмжлэл, төлбөр, засвар, зарлал, санал хураалт нэг дороос',
  icons: { icon: '/logo.png' },
}

// Бүх хуудсыг ороодог үндсэн layout — frontend/index.html + main.jsx-ийн оронд
export default function RootLayout({ children }) {
  return (
    <html lang="mn" className={`${onest.variable} ${unbounded.variable}`}>
      <body>
        {/* MUI icon-ы (emotion) загварыг SSR-д зөв оруулна — үгүй бол анивчиж, hydration анхааруулга гарна */}
        <AppRouterCacheProvider>{children}</AppRouterCacheProvider>
      </body>
    </html>
  )
}
