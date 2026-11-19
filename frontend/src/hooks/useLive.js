import useApi from './useApi'

// Сервер хариулахаас өмнө хоосон мөр — хиймэл тоо харуулахгүй
const empty = { stats: [], events: [] }

// "ШУУД" мөрийн өгөгдөл — хуудас LiveBar-аас өмнө дуудаад prop-оор дамжуулна.
// GET /api/admin/live/:page, 30 сек тутам шинэчилнэ. Алдаа гарвал хоосон мөр үлдэнэ
export default function useLive(page) {
  return useApi(`/admin/live/${page}`, null, { fallback: empty, refreshEvery: 30 }).data
}
