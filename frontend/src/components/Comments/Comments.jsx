/**
 * Зарлалын сэтгэгдэл — пост бүрийн доор нээгдэнэ. Ажилтан, оршин суугч хоёулаа хэрэглэнэ.
 *   <Comments announcementId={p.id} onCount={(n) => ...} />
 * onCount(n) — сэтгэгдлийн тоо өөрчлөгдөхөд (постын "Сэтгэгдэл (n)" товчийг шинэчлэх)
 * Шинэ сэтгэгдэл бусдад WebSocket-оор шууд харагдана (live: announcement_comments).
 * GET/POST /api/announcements/:id/comments
 */

import { useEffect, useState } from 'react'
import SendRounded from '@mui/icons-material/SendRounded'
import api from '../../api/client'
import useApi from '../../hooks/useApi'
import { relativeDay } from '../../utils/format'
import './Comments.css'

export default function Comments({ announcementId, onCount }) {
  const url = `/announcements/${announcementId}/comments`
  const { data: comments, loading, reload } = useApi(url, null, { fallback: [], live: ['announcement_comments'] })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading) onCount?.(comments.length)
  }, [comments.length, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e) {
    e.preventDefault()
    const form = e.currentTarget
    const text = new FormData(form).get('text').trim()
    if (!text) return
    form.reset()
    setError('')
    try {
      await api.post(url, { text })
      reload()
    } catch (err) {
      form.elements.text.value = text
      setError(err.message)
    }
  }

  return (
    <div className="cm">
      {loading && <p className="cm-empty">Ачааллаж байна…</p>}
      {!loading && !comments.length && <p className="cm-empty">Сэтгэгдэл алга. Эхнийх нь болоорой.</p>}
      {comments.map((c) => (
        <div key={c.id} className="cm-item">
          <span className={c.author.type === 'admin' ? 'cm-av admin' : 'cm-av'} aria-hidden="true">
            {c.author.name[0]?.toUpperCase()}
          </span>
          <div className="cm-body">
            <div className="cm-bubble">
              <strong>{c.author.name}</strong>
              {c.author.sub && <small> · {c.author.sub}</small>}
              <p>{c.body}</p>
            </div>
            <span className="cm-time">{relativeDay(c.created_at)} {new Date(c.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      ))}
      {error && <p className="cm-error" role="alert">{error}</p>}
      <form className="cm-form" onSubmit={submit}>
        <input name="text" placeholder="Сэтгэгдэл бичих…" autoComplete="off" maxLength={1000} aria-label="Сэтгэгдэл бичих" />
        <button type="submit" aria-label="Илгээх"><SendRounded sx={{ fontSize: 18 }} /></button>
      </form>
    </div>
  )
}
