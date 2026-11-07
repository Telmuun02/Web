import { useEffect, useState } from 'react'

// Тогтмол шинэчлэгдэх одоогийн цаг (ms) — дэлгэц дээрх цаг, "40 сек өмнө" зэрэг бичигт.
//   const now = useNow()  // секунд тутам
export default function useNow(every = 1000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), every)
    return () => clearInterval(timer) // хуудаснаас гарахад зогсооно
  }, [every])

  return now
}
