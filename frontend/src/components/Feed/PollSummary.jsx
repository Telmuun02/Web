/**
 * Санал хураалтын дүн — feed-ийн пост дотор (FeedPost children): "Тийм" хувь, ирц, босго, шийдвэр.
 *   <PollSummary yes={62} turnout={48} threshold={50} note="58/120 айл" result="passed" />
 * result — 'passed' | 'failed' | null (явагдаж байгаа бол null)
 */

import Badge from '../UI/Badge'
import ProgressBar from '../UI/ProgressBar'
import './PollSummary.css'

export default function PollSummary({ yes, turnout, threshold, note, result = null }) {
  return (
    <div className="poll-sum">
      <div className="poll-sum-row">
        <span>Тийм</span>
        <b>{yes}%</b>
      </div>
      <ProgressBar value={yes} color="var(--accent)" track="var(--line-soft)" />
      <div className="poll-sum-row">
        <span>Ирц {turnout}%{threshold != null && ` · босго ${threshold}%`}{note && ` · ${note}`}</span>
        {result && <Badge tone={result === 'passed' ? 'green' : 'red'} small>{result === 'passed' ? 'Батлагдсан' : 'Татгалзсан'}</Badge>}
      </div>
    </div>
  )
}
