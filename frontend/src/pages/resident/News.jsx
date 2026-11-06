import { useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/UI/Badge'
import PageHeader from '../../components/UI/PageHeader'
import ProgressBar from '../../components/UI/ProgressBar'
// Backend-тэй түр холбоогүй — бүх өгөгдөл жишээ файлаас
import { sampleEntrancePoll, sampleMeetingVote, samplePastPolls, samplePosts } from '../../samples/resident/news'
import './styles/News.css'

export default function News() {
  const [vote, setVote] = useState(null) // null — санал өгөөгүй, 'yes' | 'no'

  // Таны саналыг бусдынх дээр нэмж хувийг бодно
  const poll = sampleEntrancePoll
  const yes = poll.yes + (vote === 'yes' ? 1 : 0)
  const no = poll.no + (vote === 'no' ? 1 : 0)
  const total = yes + no
  const yesPercent = Math.round((yes / total) * 100)
  const noPercent = Math.round((no / total) * 100)

  return (
    <div className="res-news">
      <PageHeader sub="СӨХ-ийн мэдээлэл ба орцны шийдвэрүүд" title="Зарлал ба санал хураалт" />

      <div className="nw-columns">
        {/* Зарлалууд */}
        <section className="nw-posts" aria-labelledby="ann-title">
          <h2 id="ann-title">Зарлал ({samplePosts.length})</h2>
          {samplePosts.map((p) => (
            <article key={p.id} className={p.important ? 'nw-post important' : 'nw-post'}>
              <span className="nw-post-meta">
                <Badge tone={p.tone}>{p.tag}</Badge>
                <span className="nw-muted">{p.when}</span>
              </span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
              {p.meeting && <Link to="/meeting" className="nw-link">Хурлын дэлгэрэнгүй →</Link>}
            </article>
          ))}
        </section>

        <aside className="nw-side">
          {/* Орцны онлайн санал хураалт */}
          <section className="nw-poll" aria-labelledby="poll-title">
            <span className="nw-poll-tag">
              Онлайн санал · {poll.until} хүртэл <span className="nw-poll-where">· {poll.entrance}</span>
            </span>
            <h2 id="poll-title">{poll.question}</h2>
            <span className="nw-poll-info">{poll.info}</span>

            {vote ? (
              <div className="nw-results">
                <span role="status" className="nw-mine">
                  Таны санал: {vote === 'yes' ? 'Тийм' : 'Үгүй'} · дуустал өөрчилж болно
                </span>
                <div className="nw-result">
                  <div className="nw-result-head"><span>Тийм</span><span>{yesPercent}%</span></div>
                  <ProgressBar value={yesPercent} color="var(--yellow)" track="rgba(255, 255, 255, 0.15)" />
                </div>
                <div className="nw-result">
                  <div className="nw-result-head"><span>Үгүй</span><span>{noPercent}%</span></div>
                  <ProgressBar value={noPercent} color="var(--link)" track="rgba(255, 255, 255, 0.15)" />
                </div>
                <button type="button" className="nw-undo" onClick={() => setVote(null)}>Саналаа өөрчлөх</button>
              </div>
            ) : (
              // Түр — санал хадгалах API нэмэгдэх хүртэл зөвхөн дэлгэц дээр
              <div className="nw-vote">
                <button type="button" className="nw-yes" onClick={() => setVote('yes')}>Тийм</button>
                <button type="button" className="nw-no" onClick={() => setVote('no')}>Үгүй</button>
              </div>
            )}

            <span className="nw-poll-info small">{total}/{poll.units} айл санал өгсөн · босго {poll.threshold}%</span>
          </section>

          {/* Хурал дээр хураах санал */}
          <Link to="/meeting" className="nw-meeting">
            <span className="nw-meeting-tag">Хурал дээр хураана · {sampleMeetingVote.date}</span>
            <span className="nw-meeting-title">{sampleMeetingVote.question}</span>
            <span className="nw-meeting-go">Хуралд нэгдэж санал өгнө үү →</span>
          </Link>

          {/* Өмнөх дүнгүүд */}
          <section className="nw-past" aria-labelledby="past-title">
            <h2 id="past-title">Өмнөх дүнгүүд</h2>
            {samplePastPolls.map((r) => (
              <div key={r.id} className="nw-past-item">
                <span className="nw-past-head">
                  <span className="nw-past-q">{r.question}</span>
                  <Badge tone={r.passed ? 'green' : 'red'}>{r.passed ? 'Батлагдсан' : 'Татгалзсан'}</Badge>
                </span>
                <span className="nw-muted">{r.meta}</span>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  )
}
