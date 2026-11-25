/**
 * Зарлал ба санал хураалт — /news
 * СӨХ-ийн зарлалууд, идэвхтэй ба дууссан санал хураалтууд нэг feed-д огноогоор пост хэлбэрээр (FeedPost; зарлалд сэтгэгдэлтэй, хурал зарласан бол "Хуралд орох" → /meeting), идэвхтэй санал хураалтад санал өгөх.
 * GET /api/resident/news, POST /api/resident/polls/:id/vote
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/UI/PageHeader'
import ProgressBar from '../../components/UI/ProgressBar'
import Toast from '../../components/UI/Toast'
import FeedPost from '../../components/Feed/FeedPost'
import PollSummary from '../../components/Feed/PollSummary'
import api from '../../api/client'
import useApi from '../../hooks/useApi'
import { monthDay } from '../../utils/format'
import './styles/News.css'

function PollCard({ poll, onVoted }) {
  const [state, setState] = useState({ sending: false, message: '', changing: false })

  const voted = poll.my_option_id != null && !state.changing
  const total = poll.options.reduce((sum, o) => sum + o.votes, 0)

  async function vote(optionId) {
    setState({ sending: true, message: '', changing: false })
    try {
      onVoted(await api.post(`/resident/polls/${poll.id}/vote`, { option_id: optionId }))
      setState({ sending: false, message: '', changing: false })
    } catch (err) {
      setState({ sending: false, message: err.message, changing: true })
    }
  }

  return (
    <FeedPost
      post={{ id: poll.id, title: poll.title, body: poll.description, created_at: poll.starts_at }}
      meta="Бүх айл"
      tag={`Санал хураалт · ${monthDay(poll.ends_at)} хүртэл`}
      comments={false}
    >

      {voted ? (
        <div className="nw-results">
          <span role="status" className="nw-mine">
            Таны санал: {poll.options.find((o) => o.id === poll.my_option_id)?.label}
          </span>
          <button type="button" className="nw-change" onClick={() => setState((s) => ({ ...s, changing: true }))}>
            Саналаа өөрчлөх
          </button>
          {poll.options.map((o, i) => {
            const percent = total ? Math.round((o.votes / total) * 100) : 0
            return (
              <div key={o.id} className="nw-result">
                <div className="nw-result-head"><span>{o.label}</span><span>{percent}%</span></div>
                <ProgressBar value={percent} color={i === 0 ? 'var(--accent)' : 'var(--field-border)'} track="var(--line-soft)" />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="nw-vote">
          {poll.options.map((o, i) => (
            <button
              key={o.id}
              type="button"
              className={i === 0 ? 'nw-yes' : 'nw-no'}
              disabled={state.sending}
              aria-pressed={state.changing ? o.id === poll.my_option_id : undefined}
              onClick={() => vote(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      <Toast>{state.message}</Toast>
      <span className="nw-poll-info small">
        {poll.voted_units}/{poll.total_units} айл санал өгсөн · босго {poll.threshold_percent}%
      </span>
    </FeedPost>
  )
}

export default function News() {
  const { data, error } = useApi('/resident/news', null, { fallback: null })
  const [votedPolls, setVotedPolls] = useState({})

  if (error) return <div className="res-news"><p role="alert">{error}</p></div>
  if (!data) return <div className="res-news"><p>Ачааллаж байна…</p></div>

  const { posts, past_polls: pastPolls, meeting_votes: meetingVotes } = data
  const activePolls = data.active_polls.map((p) => votedPolls[p.id] ?? p)
  const feed = [
    ...posts.map((p) => ({ kind: 'post', key: `a${p.id}`, date: p.created_at, item: p })),
    ...activePolls.map((p) => ({ kind: 'active', key: `p${p.id}`, date: p.starts_at, item: p })),
    ...pastPolls.map((p) => ({ kind: 'past', key: `p${p.id}`, date: p.ends_at, item: p })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="res-news">
      <PageHeader sub="СӨХ-ийн мэдээлэл ба орцны шийдвэрүүд" title="Зарлал ба санал хураалт" />

      <div className="nw-columns">

        <section className="nw-posts" aria-label="Зарлал ба санал хураалт">
          {feed.length === 0 && <p>Зарлал алга</p>}
          {feed.map(({ kind, key, item: p }) => {
            if (kind === 'active') {
              return <PollCard key={key} poll={p} onVoted={(result) => setVotedPolls((v) => ({ ...v, [p.id]: result }))} />
            }
            if (kind === 'past') {
              return (
                <FeedPost
                  key={key}
                  post={{ id: p.id, title: p.title, created_at: p.ends_at }}
                  meta="Бүх айл"
                  tag="Санал хураалт · дууссан"
                  comments={false}
                >
                  <PollSummary yes={p.yes_percent} turnout={p.turnout_percent} result={p.passed ? 'passed' : 'failed'} />
                </FeedPost>
              )
            }
            return (
              <FeedPost
                key={key}
                post={p}
                meta={p.entrance_number ? `${p.entrance_number}-р орц` : 'Бүх орц'}
                action={p.meeting_id && <Link to="/meeting" className="nw-post-meeting">Хуралд орох</Link>}
              />
            )
          })}
        </section>

        {meetingVotes.length > 0 && (
          <aside className="nw-side">
            {meetingVotes.map((v) => (
              <Link key={v.title} to="/meeting" className="nw-meeting">
                <span className="nw-meeting-tag">Хурал дээр хураана · {monthDay(v.starts_at)}</span>
                <span className="nw-meeting-title">{v.title}</span>
                <span className="nw-meeting-go">Хуралд нэгдэж санал өгнө үү →</span>
              </Link>
            ))}
          </aside>
        )}
      </div>
    </div>
  )
}
