import useApi from './useApi'

// "ШУУД" мөрийн өгөгдөл — хуудас LiveBar-аас өмнө дуудаад prop-оор дамжуулна.
// fallback — сервер хариулахаас өмнө / алдаа гарвал харуулах sample. 30 сек тутам шинэчилнэ
export default function useLive(page, fallback) {
  return useApi(`/admin/live/${page}`, null, { fallback, refreshEvery: 30 }).data
}
