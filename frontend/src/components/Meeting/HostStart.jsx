/**
 * HostStart — ажилтан шинэ хурлын гарчиг, хамрах хүрээ (бүх байр эсвэл нэг орц) сонгох маягт
 * "Хурал эхлүүлэх" → урьдчилан харах хуудас. Орцнуудыг тоотуудаас гаргана (GET /api/admin/units).
 * Props: onStart({ title, entrance }) — entrance: орцны дугаар эсвэл null (бүх байр)
 */

import { useState } from 'react'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import Button from '../UI/Button'
import Segmented from '../UI/Segmented'
import useApi from '../../hooks/useApi'
import './Meeting.css'

export default function HostStart({ onStart }) {
  const [title, setTitle] = useState('')
  const [scope, setScope] = useState('all')
  const { data: units } = useApi('/admin/units', null, { fallback: [] })

  const entrances = [...new Set(units.map((u) => u.entrance))].sort((a, b) => a - b)
  const options = [
    { value: 'all', label: 'Бүх байр', note: `${units.length} тоот` },
    ...entrances.map((n) => ({
      value: String(n),
      label: `${n}-р орц`,
      note: `${units.filter((u) => u.entrance === n).length} тоот`,
    })),
  ]

  function submit(e) {
    e.preventDefault()
    onStart({ title: title.trim() || 'Хурал', entrance: scope === 'all' ? null : Number(scope) })
  }

  return (
    <form className="meeting-start" onSubmit={submit}>
      <h2>Шинэ хурал</h2>
      <p>Дараагийн алхамд камер, микрофоноо шалгаад эхлүүлнэ. Сонгосон айлууд "Хурал" хуудаснаас нэгдэнэ.</p>
      <label>
        Гарчиг
        <input value={title} maxLength={100} placeholder="Жишээ: Орцны ээлжит хурал" onChange={(e) => setTitle(e.target.value)} />
      </label>
      <fieldset className="meeting-scope">
        <legend>Хэний хурал</legend>
        <Segmented variant="pills" label="Хэний хурал" options={options} value={scope} onChange={setScope} />
      </fieldset>
      <Button variant="primary" type="submit"><PlayArrowRounded sx={{ fontSize: 20 }} /> Хурал эхлүүлэх</Button>
    </form>
  )
}
