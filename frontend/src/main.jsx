/**
 * Frontend-ийн эхлэлийн цэг — App-ыг #root-д зурна.
 * BrowserRouter — URL-ээр хуудас солих, StrictMode — хөгжүүлэлтийн үеийн нэмэлт шалгалт.
 * theme.css (өнгөний token-ууд), index.css (ерөнхий загвар)-ыг энд нэг удаа ачаална
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './theme/theme.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
