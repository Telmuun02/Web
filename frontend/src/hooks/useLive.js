/**
 * Ажилтны хуудсуудын "ШУУД" мөрийн өгөгдөл (LiveBar-т prop-оор өгнө).
 *   const live = useLive('invoices')
 * GET /api/admin/live/:page — хуудас бүр аль хүснэгтээс хамаарахыг энд жагсаасан,
 * тэдгээр өөрчлөгдөхөд WebSocket-оор шууд шинэчлэгдэнэ. Алдаа гарвал хоосон мөр үлдэнэ
 */

import useApi from './useApi'

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

const empty = { stats: [], events: [] }

export default function useLive(page) {
  return useApi(`/admin/live/${page}`, null, { fallback: empty, live: tables[page] }).data
}
