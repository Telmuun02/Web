import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlined from '@mui/icons-material/LightModeOutlined'
import { useTheme } from './useTheme'

// className — байрлах газрын загвар (sidebar-д 'sidebar-link', header-т 'res-icon-btn')
// labelClassName — өгвөл icon-ы хажууд бичиг харуулна (sidebar), өгөхгүй бол зөвхөн icon (header)
export default function ThemeToggle({ className, labelClassName }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  const label = dark ? 'Цайвар горим' : 'Бараан горим' // дарахад юу болохыг хэлнэ
  const Icon = dark ? LightModeOutlined : DarkModeOutlined

  return (
    <button type="button" className={className} onClick={toggle} aria-label={label} title={label}>
      <Icon sx={{ fontSize: labelClassName ? 18 : 22 }} />
      {labelClassName && <span className={labelClassName}>{label}</span>}
    </button>
  )
}
