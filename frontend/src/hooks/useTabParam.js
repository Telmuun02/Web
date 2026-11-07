import { useSearchParams } from 'react-router-dom'

// Сонгосон таб — state биш, URL-д (?tab=debtors) хадгална.
// Refresh хийсэн ч, линкээр ирсэн ч тэр табаараа нээгдэнэ.
//   const [tab, setTab] = useTabParam('all')
// replace — таб солих бүрд браузерын түүхэнд шинэ алхам нэмэхгүй
export default function useTabParam(defaultKey) {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? defaultKey

  function setTab(key) {
    setSearchParams(key === defaultKey ? {} : { tab: key }, { replace: true })
  }

  return [tab, setTab]
}
