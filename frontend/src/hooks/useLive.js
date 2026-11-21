import useApi from './useApi'

// Хуудас бүрийн "ШУУД" мөр аль хүснэгтээс хамаарах — өөрчлөгдөхөд WebSocket-оор шууд шинэчлэгдэнэ
const tables = {
  invoices: ['invoices', 'payments'],
  requests: ['requests'],
  polls: ['polls', 'poll_votes'],
  units: ['units', 'users'],
  announcements: ['announcements'],
  reports: ['payments', 'expenses', 'invoices'],
  settings: ['admins'],
  profile: ['payments', 'announcements', 'polls'],
}

// Сервер хариулахаас өмнө хоосон мөр — хиймэл тоо харуулахгүй
const empty = { stats: [], events: [] }

// "ШУУД" мөрийн өгөгдөл — хуудас LiveBar-аас өмнө дуудаад prop-оор дамжуулна.
// GET /api/admin/live/:page — DB өөрчлөгдөхөд шууд, нөөцөөр 2 минут тутам шинэчилнэ. Алдаа гарвал хоосон мөр үлдэнэ
export default function useLive(page) {
  return useApi(`/admin/live/${page}`, null, { fallback: empty, refreshEvery: 120, live: tables[page] }).data
}
