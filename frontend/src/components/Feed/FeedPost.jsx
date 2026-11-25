/**
 * Зарлалын пост — сошиал feed-ийн хэлбэр: зохиогч, цаг, хэнд → гарчиг, агуулга → товч → сэтгэгдэл.
 * Ажилтны Зарлал (/admin/announcements), оршин суугчийн Зарлал (/news) хоёулаа хэрэглэнэ.
 *   <FeedPost post={a} author="СӨХ" meta="1-р орц · Апп · SMS" action={<Link .../>} />
 * post — id, title, body, important, created_at, comment_count
 * tag — баруун дээд буланд тэмдэг ("Санал хураалт · 11/30 хүртэл")
 * action — агуулгын доорх товч (хурал руу орох гэх мэт), children — постын дотор нэмэлт хэсэг (санал өгөх)
 * comments — false бол сэтгэгдлийн хэсэг гарахгүй (санал хураалт)
 * onSave({ title, body }) — өгвөл баруун дээд буланд "Засах" товч гарч, пост дотроо input болж засагдана
 */

import { useState } from 'react'
import ChatBubbleOutlineRounded from '@mui/icons-material/ChatBubbleOutlineRounded'
import EditOutlined from '@mui/icons-material/EditOutlined'
import Badge from '../UI/Badge'
import Comments from '../Comments/Comments'
import { relativeDay } from '../../utils/format'
import './FeedPost.css'

export default function FeedPost({ post, author = 'СӨХ', meta, tag, action, children, comments = true, onSave }) {
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [count, setCount] = useState(post.comment_count ?? 0)

  async function save(e) {
    e.preventDefault()
    setEdit((x) => ({ ...x, saving: true, error: '' }))
    try {
      await onSave({ title: edit.title.trim(), body: edit.body.trim() })
      setEdit(null)
    } catch (err) {
      setEdit((x) => ({ ...x, saving: false, error: err.message }))
    }
  }

  const time = new Date(post.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <article className={post.important ? 'feed-post important' : 'feed-post'}>
      <header className="feed-head">
        <span className="feed-av" aria-hidden="true">{author[0]?.toUpperCase()}</span>
        <span className="feed-who">
          <strong>{author}</strong>
          <small>{relativeDay(post.created_at)} · {time}{meta && ` · ${meta}`}</small>
        </span>
        {Boolean(post.important) && <Badge tone="red" small>Чухал</Badge>}
        {tag && <Badge tone="yellow" small>{tag}</Badge>}
        {onSave && !edit && (
          <button type="button" className="feed-edit" aria-label="Засах" title="Засах" onClick={() => setEdit({ title: post.title, body: post.body ?? '', saving: false, error: '' })}>
            <EditOutlined sx={{ fontSize: 18 }} />
          </button>
        )}
      </header>

      {edit ? (
        <form className="feed-form" onSubmit={save}>
          <input value={edit.title} maxLength={150} aria-label="Гарчиг" onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
          <textarea rows="4" value={edit.body} aria-label="Агуулга" onChange={(e) => setEdit({ ...edit, body: e.target.value })} />
          {edit.error && <span className="feed-error" role="alert">{edit.error}</span>}
          <div className="feed-form-buttons">
            <button type="button" onClick={() => setEdit(null)}>Болих</button>
            <button type="submit" className="primary" disabled={edit.saving || !edit.title.trim() || !edit.body.trim()}>
              {edit.saving ? 'Хадгалж байна…' : 'Хадгалах'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <h3>{post.title}</h3>
          {post.body && <p>{post.body}</p>}
        </>
      )}
      {children}
      {action}

      {comments && (
        <div className="feed-actions">
          <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <ChatBubbleOutlineRounded sx={{ fontSize: 18 }} />
            Сэтгэгдэл{count > 0 && ` (${count})`}
          </button>
        </div>
      )}

      {comments && open && <Comments announcementId={post.id} onCount={setCount} />}
    </article>
  )
}
