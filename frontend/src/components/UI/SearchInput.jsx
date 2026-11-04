import SearchOutlined from '@mui/icons-material/SearchOutlined'
import './SearchInput.css'

// Хайлтын талбар — томруулдаг шилний дүрстэй.
// onChange(текст) — event биш, шууд бичсэн текстийг өгнө. placeholder нь дэлгэц уншигчид нэр болно
export default function SearchInput({ value, onChange, placeholder }) {
  return (
    <label className="ui-search">
      <SearchOutlined sx={{ fontSize: 18 }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  )
}
