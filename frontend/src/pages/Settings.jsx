import { useState } from 'react'
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined'
import QrCode2Outlined from '@mui/icons-material/QrCode2Outlined'
import Avatar from '../components/UI/Avatar'
import Badge from '../components/UI/Badge'
import Button from '../components/UI/Button'
import Card from '../components/UI/Card'
import Field from '../components/UI/Field'
import ListItem from '../components/UI/ListItem'
import PageHeader from '../components/UI/PageHeader'
import Segmented from '../components/UI/Segmented'
import Switch from '../components/UI/Switch'
import Toast from '../components/UI/Toast'
import './styles/Settings.css'

const feeModes = [
  { value: 'fixed', label: 'Тоот бүрт тогтмол' },
  { value: 'area', label: 'Талбайгаар (м²)' },
]

// Эрхийн нэр ба шошгоны өнгө
const accessInfo = {
  admin: { label: 'Бүх эрх', tone: 'yellow' },
  finance: { label: 'Санхүү', tone: 'green' },
  requests: { label: 'Хүсэлт', tone: 'gray' },
}

// Түр жишээ өгөгдөл — ажилтны API нэмэгдэх хүртэл
const sampleStaff = [
  { id: 1, name: 'Дорж Б.', role: 'СӨХ-ийн дарга', access: 'admin' },
  { id: 2, name: 'Ариунаа С.', role: 'Нягтлан', access: 'finance' },
  { id: 3, name: 'Бат-Эрдэнэ Г.', role: 'Сантехникч', access: 'requests' },
  { id: 4, name: 'Ганзориг Д.', role: 'Цахилгаанчин', access: 'requests' },
]

const automationItems = [
  { key: 'autoInvoice', label: 'Нэхэмжлэл автоматаар үүсгэх', hint: 'Сар бүрийн 1-нд бүх тоотод' },
  { key: 'remind', label: 'Төлбөрийн сануулга', hint: 'Эцсийн хугацаанаас 3 хоногийн өмнө' },
  { key: 'smsDebt', label: 'Өртэй тоотод SMS', hint: 'Хугацаа хэтэрснээс 7 хоногийн дараа' },
  { key: 'record', label: 'Хурлыг бичлэгжүүлэх', hint: 'Оролцогч бүрт мэдэгдэл харагдана' },
]

// '1,370' → 1370
function toNumber(text) {
  return Number(text.replace(/\D/g, '')) || 0
}

// Талбайгаар тооцоход гарах жишээ дүн — мянгат хүртэл тоймлоно. 62, 1370 → '85,000'
function example(area, rate) {
  return (Math.round((area * rate) / 1000) * 1000).toLocaleString('en-US')
}

export default function Settings() {
  const [form, setForm] = useState({
    mode: 'fixed',
    fixedRate: '85,000', // тоот бүрийн сарын хураамж
    areaRate: '1,370', // 1 м²-ийн үнэ
    due: '25',
    penalty: '0.5%',
  })
  const [auto, setAuto] = useState({ autoInvoice: true, remind: true, smsDebt: true, record: false })
  const [saved, setSaved] = useState(false)

  const fixed = form.mode === 'fixed'
  const rateField = fixed ? 'fixedRate' : 'areaRate' // аль аргаар тооцож байгаагаас хамаарна
  const areaRate = toNumber(form.areaRate)
  const feeHint = fixed
    ? 'Бүх тоот ижил дүн төлнө. Том тоотод тусгай дүн тоот тус бүрийн карт дээрээс тавина.'
    : `Жишээ: 62 м² ≈ ${example(62, areaRate)}₮ · 74 м² ≈ ${example(74, areaRate)}₮. Өөрчлөлтийг ерөнхий хурлаар батлуулах шаардлагатай.`

  // Аливаа талбар өөрчлөгдөхөд "хадгалагдлаа" мэдэгдлийг нууна
  function change(field, value) {
    setForm({ ...form, [field]: value })
    setSaved(false)
  }

  function toggle(key, value) {
    setAuto({ ...auto, [key]: value })
    setSaved(false)
  }

  // Түр — тохиргооны API нэмэгдэх хүртэл зөвхөн мэдэгдэл харуулна (DB-д хадгалагдахгүй)
  function save() {
    setSaved(true)
  }

  return (
    <div className="settings">
      <PageHeader sub="Зөвхөн СӨХ-ийн дарга ба нягтлан өөрчилнө" title="Тохиргоо">
        <Button variant="primary" onClick={save}>Хадгалах</Button>
      </PageHeader>

      <Toast>
        {saved && 'Тохиргоо хадгалагдлаа. Хураамжийн өөрчлөлт дараагийн сарын нэхэмжлэлээс үйлчилнэ.'}
      </Toast>

      <div className="settings-columns">
        <div className="settings-col">
          <Card title="Хураамж">
            <Segmented label="Тооцох арга" options={feeModes} value={form.mode} onChange={(v) => change('mode', v)} />

            <div className="settings-fields">
              <Field label={fixed ? 'Сарын хураамж (₮)' : '1 м²-ийн үнэ (₮)'}>
                <input inputMode="numeric" value={form[rateField]} onChange={(e) => change(rateField, e.target.value)} />
              </Field>
              <Field label="Төлөх эцсийн өдөр">
                <select value={form.due} onChange={(e) => change('due', e.target.value)}>
                  <option value="25">Сар бүрийн 25</option>
                  <option value="20">Сар бүрийн 20</option>
                  <option value="last">Сарын сүүлийн өдөр</option>
                </select>
              </Field>
              <Field label="Алданги (өдөрт)">
                <input value={form.penalty} onChange={(e) => change('penalty', e.target.value)} />
              </Field>
            </div>

            <p className="settings-hint">{feeHint}</p>
          </Card>

          <Card title="Төлбөр хүлээн авах">
            <div>
              <ListItem
                icon={<span className="settings-icon"><QrCode2Outlined sx={{ fontSize: 20 }} /></span>}
                title="QPay"
                hint="Нэхэмжлэл бүрт QR автоматаар үүснэ"
              >
                <Badge tone="green">Холбогдсон</Badge>
              </ListItem>
              <ListItem
                icon={<span className="settings-icon"><AccountBalanceOutlined sx={{ fontSize: 20 }} /></span>}
                title="Банкны данс"
                hint="[БАНК] · [ДАНСНЫ ДУГААР] · гүйлгээг өдөр бүр тулгана"
              >
                {/* Түр — дансны мэдээлэл засах API нэмэгдэх хүртэл ажиллахгүй */}
                <Button size="small">Засах</Button>
              </ListItem>
            </div>
          </Card>
        </div>

        <div className="settings-col">
          {/* Түр — ажилтан нэмэх API нэмэгдэх хүртэл ажиллахгүй */}
          <Card title="Ажилтан ба эрх" action={<Button size="small">+ Ажилтан нэмэх</Button>}>
            <div>
              {sampleStaff.map((s) => (
                <ListItem key={s.id} icon={<Avatar name={s.name} dark />} title={s.name} hint={s.role}>
                  <Badge tone={accessInfo[s.access].tone}>{accessInfo[s.access].label}</Badge>
                </ListItem>
              ))}
            </div>
          </Card>

          <Card title="Автомат үйлдэл">
            <div>
              {automationItems.map((item) => (
                <Switch
                  key={item.key}
                  label={item.label}
                  hint={item.hint}
                  checked={auto[item.key]}
                  onChange={(value) => toggle(item.key, value)}
                />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
