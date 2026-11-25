/**
 * Server state — хуудаслалттай жагсаалт + infinite scroll.
 * Backend { rows, next_offset } буцаана (next_offset null бол дараагийн хуудас алга).
 *   const { rows, loading, error, next, setRows, sentinelRef } = usePagedList('/admin/invoices', { status }, toRow)
 *   <div ref={sentinelRef} /> — жагсаалтын доор тавина, харагдахад дараагийн хуудсыг татна
 * url — null бол татахгүй, params өөрчлөгдөхөд эхний хуудаснаас дахин эхэлнэ
 * toRow — серверийн мөрийг дэлгэцийн мөр болгох функц
 * delay — мс: хайлтын үсэг бүрд хүсэлт явуулахгүйн тулд
 * live — хүснэгтийн нэрс: тэдгээр нь DB-д өөрчлөгдөхөд (WebSocket) эхний хуудсыг дахин татна
 */

import { useEffect, useRef, useState } from 'react'
import api from '../api/client'
import { useTableChange } from './useRealtime'

export default function usePagedList(url, params, toRow, { delay = 0, live } = {}) {
  const [list, setList] = useState({ rows: [], loading: Boolean(url), error: '', next: null })
  const sentinelRef = useRef(null)
  const requestId = useRef(0)
  const key = JSON.stringify(params ?? {})

  function load(offset) {
    const id = ++requestId.current
    setList((l) => ({ ...l, loading: true }))

    api.get(url, { params: { ...params, offset } })
      .then((data) => {
        if (id !== requestId.current) return
        const page = data.rows.map(toRow)
        setList((l) => ({
          rows: offset === 0 ? page : [...l.rows, ...page],
          loading: false,
          error: '',
          next: data.next_offset,
        }))
      })
      .catch((err) => {
        if (id === requestId.current) setList((l) => ({ ...l, loading: false, error: err.message }))
      })
  }

  useEffect(() => {
    if (!url) return
    const timer = setTimeout(() => load(0), delay)
    return () => clearTimeout(timer)
  }, [url, key]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || list.next == null || list.loading) return

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) load(list.next) },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [list.next, list.loading]) // eslint-disable-line react-hooks/exhaustive-deps

  useTableChange(url ? live : null, () => load(0))

  const setRows = (update) => setList((l) => ({ ...l, rows: update(l.rows) }))

  return { ...list, setRows, sentinelRef }
}
