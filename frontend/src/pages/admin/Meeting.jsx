/**
 * Хурал (ажилтан) — /admin/meeting
 * Шинэ хурал эхлүүлж хөтөлнө: гарчиг бичээд "Хурал эхлүүлэх" дарахад өрөө нээгдэж, оршин суугчид /meeting-ээс нэгдэнэ (CallRoom host).
 * Камер зөвхөн localhost эсвэл https дээр ажиллана.
 */

import PageHeader from '../../components/UI/PageHeader'
import CallRoom from '../../components/Meeting/CallRoom'
import './styles/Meeting.css'

export default function Meeting() {
  return (
    <div className="meeting">
      <PageHeader sub="Оршин суугчдын онлайн хурал" title="Хурал" />
      <CallRoom host />
    </div>
  )
}
