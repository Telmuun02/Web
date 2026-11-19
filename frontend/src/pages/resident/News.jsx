import { useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/UI/Badge'
import PageHeader from '../../components/UI/PageHeader'
import ProgressBar from '../../components/UI/ProgressBar'
import Toast from '../../components/UI/Toast'
import api from '../../api/client'
import useApi from '../../hooks/useApi'
import { monthDay, relativeDay } from '../../utils/format'
import './styles/News.css'

// Нэг идэвхтэй санал хураалт — сонголтууд, ирц, өөрийн санал
function PollCard({ poll, onVoted }) {
  const [state, setState] = useState({ sending: false, message: '' })
  const voted = poll.my_option_id != null
  const total = poll.options.reduce((sum, o) => sum + o.votes, 0)

  // POST /api/resident/polls/:id/vote — нэг тоот нэг л санал, дараа нь өөрчлөхгүй
  async function vote(optionId) {
    setState({ sending: true, message: '' })
    try {
      onVoted(await api.post(`/resident/polls/${poll.id}/vote`, { option_id: optionId }))
      setState({ sending: false, message: '' })
    } catch (err) {
      setState({ sending: false, message: err.message })
    }
  }

  return (
    <section className="nw-poll" aria-labelledby={`poll-${poll.id}`}>
      <span className="nw-poll-tag">Онлайн санал · {monthDay(poll.ends_at)} хүртэл</span>
      <h2 id={`poll-${poll.id}`}>{poll.title}</h2>
      {poll.description && <span className="nw-poll-info">{poll.description}</span>}

      {voted ? (
        <div className="nw-results">
          <span role="status" className="nw-mine">
            Таны санал: {poll.options.find((o) => o.id === poll.my_option_id)?.label}
          </span>
          {poll.options.map((o, i) => {
            const percent = total ? Math.round((o.votes / total) * 100) : 0
            return (
              <div key={o.id} className="nw-result">
                <div className="nw-result-head"><span>{o.label}</span><span>{percent}%</span></div>
                <ProgressBar value={percent} color={i === 0 ? 'var(--yellow)' : 'var(--link)'} track="rgba(255, 255, 255, 0.15)" />
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
    </section>
  )
}

export default function News() {
  // GET /api/resident/news — санал өгсний дараа тухайн санал хураалтыг хариугаар нь солино
  const { data, error } = useApi('/resident/news', null, { fallback: null })
  const [votedPolls, setVotedPolls] = useState({}) // { [poll_id]: санал өгсний дараах дүн }

  if (error) return <div className="res-news"><p role="alert">{error}</p></div>
  if (!data) return <div className="res-news"><p>Ачааллаж байна…</p></div>

  const { posts, past_polls: pastPolls, meeting_votes: meetingVotes } = data
  const activePolls = data.active_polls.map((p) => votedPolls[p.id] ?? p)

  return (
    <div className="res-news">
      <PageHeader sub="СӨХ-ийн мэдээлэл ба орцны шийдвэрүүд" title="Зарлал ба санал хураалт" />

      <div className="nw-columns">
        {/* Зарлалууд */}
        <section className="nw-posts" aria-labelledby="ann-title">
          <h2 id="ann-title">Зарлал ({posts.length})</h2>
          {posts.length === 0 && <p>Зарлал алга</p>}
          {posts.map((p) => (
            <article key={p.id} className={p.important ? 'nw-post important' : 'nw-post'}>
              <span className="nw-post-meta">
                <Badge tone={p.important ? 'red' : 'gray'}>{p.important ? 'Чухал' : 'Мэдээлэл'}</Badge>
                <span className="nw-muted">{relativeDay(p.created_at)}</span>
              </span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </article>
          ))}
        </section>

        <aside className="nw-side">
          {/* Идэвхтэй онлайн санал хураалтууд */}
          {activePolls.length === 0 && (
            <section className="nw-poll" aria-label="Санал хураалт">
              <span className="nw-poll-info">Одоогоор явагдаж буй санал хураалт алга</span>
            </section>
          )}
          {activePolls.map((p) => (
            <PollCard
              key={p.id}
              poll={p}
              onVoted={(result) => setVotedPolls((v) => ({ ...v, [p.id]: result }))}
            />
          ))}

          {/* Удахгүй болох хурал дээр хураах саналууд — meeting_agenda.poll_id */}
          {meetingVotes.map((v) => (
            <Link key={v.title} to="/meeting" className="nw-meeting">
              <span className="nw-meeting-tag">Хурал дээр хураана · {monthDay(v.starts_at)}</span>
              <span className="nw-meeting-title">{v.title}</span>
              <span className="nw-meeting-go">Хуралд нэгдэж санал өгнө үү →</span>
            </Link>
          ))}

          {/* Өмнөх дүнгүүд */}
          <section className="nw-past" aria-labelledby="past-title">
            <h2 id="past-title">Өмнөх дүнгүүд</h2>
            {pastPolls.length === 0 && <span className="nw-muted">Дууссан санал хураалт алга</span>}
            {pastPolls.map((r) => (
              <div key={r.id} className="nw-past-item">
                <span className="nw-past-head">
                  <span className="nw-past-q">{r.title}</span>
                  <Badge tone={r.passed ? 'green' : 'red'}>{r.passed ? 'Батлагдсан' : 'Татгалзсан'}</Badge>
                </span>
                <span className="nw-muted">
                  Тийм {r.yes_percent}% · ирц {r.turnout_percent}% · {monthDay(r.ends_at)}
                </span>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  )
}
