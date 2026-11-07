import { useEffect, useState } from 'react'
import api from '../api/client'

// Server state — GET хүсэлтийн өгөгдөл, ачаалж буй эсэх, алдаа нэг дор.
//   const { data, loading, error } = useApi('/admin/requests/counts', null, { fallback: {} })
// url   — null бол юу ч татахгүй
// params — өөрчлөгдөхөд дахин татна
// fallback — хариу ирэхээс өмнө / алдаа гарвал харуулах утга
// delay — мс: хайлтын талбарт үсэг бүрд хүсэлт явуулахгүйн тулд (жишээ 300)
// refreshEvery — сек: тэгээс их бол тэр хугацаа тутам дахин татна
export default function useApi(url, params, { fallback, delay = 0, refreshEvery = 0 } = {}) {
  const [state, setState] = useState({ data: fallback, loading: Boolean(url), error: '' })
  const key = JSON.stringify(params ?? {}) // object-ийг харьцуулж болохуйц болгоно

  useEffect(() => {
    if (!url) return
    let alive = true // хуудаснаас гарсан / params солигдсоны дараа ирсэн хариуг үл тооно

    const load = () =>
      api.get(url, { params })
        .then((data) => alive && setState({ data, loading: false, error: '' }))
        .catch((err) => alive && setState((s) => ({ ...s, loading: false, error: err.message })))

    const first = setTimeout(load, delay)
    const timer = refreshEvery ? setInterval(load, refreshEvery * 1000) : null
    return () => {
      alive = false
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [url, key]) // eslint-disable-line react-hooks/exhaustive-deps

  return state
}
