// Самбарын жишээ өгөгдөл — backend-тэй ТҮР холбоогүй хувилбар.
// Хэлбэр нь аль болох backend-ийн хариутай ижил (period, billed, collected, code, debt…),
// тиймээс API бэлэн болоход Dashboard.jsx-д sample-ийн оронд api.get(...)-ийн хариуг өгөхөд болно.
// Backend-д одоогоор байхгүй өгөгдөл (лифт, дулаан, камер, онлайн, ажилтны үйлдэл) — бүгд жишээ.

// n секундын өмнөх цаг — "40 сек өмнө" гэх мэтийг бодоход
function secondsAgo(n) {
  return new Date(Date.now() - n * 1000)
}

// Дээд талын картууд
export const sampleStats = {
  today: { amount: 1275000, count: 15 },                                     // өнөөдөр цугласан
  month: { paidUnits: 92, units: 120, collected: 7900000, billed: 10200000 }, // энэ сарын төлөлт
  openRequests: 9,                                                            // нээлттэй хүсэлт
  online: 47,                                                                 // апп-д яг одоо
}

// Өнөөдрийн цаг тутмын орлого (₮)
export const sampleHours = [
  { label: '08', amount: 120000 },
  { label: '09', amount: 340000 },
  { label: '10', amount: 210000 },
  { label: '11', amount: 260000 },
  { label: '12', amount: 180000 },
  { label: 'одоо', amount: 165000 },
]

// Төлбөрийн урсгал — сүүлд орсон төлбөрүүд
export const samplePayments = [
  { id: 5, unit: '3-12', name: 'Даваа Ц.', amount: 101200, via: 'QPay · Хаан банк', paidAt: secondsAgo(40) },
  { id: 4, unit: '1-27', name: 'Хулан М.', amount: 85000, via: 'QPay · Голомт', paidAt: secondsAgo(210) },
  { id: 3, unit: '2-07', name: 'Батзаяа О.', amount: 85000, via: 'Дансаар', paidAt: secondsAgo(460) },
  { id: 2, unit: '3-64', name: 'Тэмүүлэн Г.', amount: 40000, via: 'Бэлэн · Ариунаа', paidAt: secondsAgo(900) },
  { id: 1, unit: '1-03', name: 'Энхтуяа Б.', amount: 85000, via: 'QPay · ХХБ', paidAt: secondsAgo(1500) },
]

// Шинэ хүсэлт. category — backend-ийн requests.category enum.
// urgent, seen — backend-д одоохондоо байхгүй талбар
export const sampleRequests = [
  { id: 1042, unit: '2-45', title: 'Угаалтуурын доор ус дусаж байна', category: 'plumbing', urgent: true, seen: false, createdAt: secondsAgo(420) },
  { id: 1041, unit: '1-12', title: 'Коридорын гэрэл анивчиж байна', category: 'electrical', urgent: false, seen: true, createdAt: secondsAgo(1300) },
  { id: 1040, unit: '2-18', title: 'Жорлонгийн сав байнга гоожино', category: 'plumbing', urgent: false, seen: true, createdAt: secondsAgo(2600) },
]

// Байрны систем
export const sampleLifts = [
  { name: '1-р орц', floor: 3, dir: 'up', ok: true },
  { name: '2-р орц', floor: 7, dir: 'down', ok: true },
  { name: '3-р орц', floor: 1, ok: false, note: 'Засварт · 14:00' },
]
export const liftFloors = 9

// Орцны дундаж дулаан (°C). 20-оос доош бол хүйтэн гэж үзнэ
export const sampleTemps = [
  { name: '1-р орц', value: 21.4 },
  { name: '2-р орц', value: 20.8 },
  { name: '3-р орц', value: 19.6 },
]
export const sampleSupplyTemp = 67.8

export const sampleUtilities = [
  { label: 'Халуун усны даралт', value: '3.10 бар' },
  { label: 'Хүйтэн усны даралт', value: '3.60 бар' },
  { label: 'Нийтийн цахилгаан', value: '18.2 кВт' },
  { label: 'Өнөөдрийн ус', value: '41.6 м³' },
]

export const sampleCameras = [
  { name: 'Зогсоол А', online: true },
  { name: 'Зогсоол Б', online: true },
  { name: '1-р орцны хаалга', online: true },
  { name: '2-р орцны хаалга', online: true },
  { name: 'Тоглоомын талбай', online: true },
  { name: 'Хогийн цэг', online: false, note: 'Тасарсан · 4 мин' },
]

// Идэвхтэй санал хураалт. threshold — ирцийн босго (%)
export const samplePoll = { title: 'Тоглоомын талбайг шинэчлэх үү?', voted: 55, units: 120, threshold: 50 }

// Апп-д онлайн хүний тоо — сүүлийн 30 минут, минут тутам
export const sampleOnline = [
  38, 41, 40, 44, 46, 43, 39, 42, 45, 48, 50, 47, 44, 46, 49,
  52, 55, 51, 48, 46, 44, 47, 50, 53, 49, 46, 45, 48, 47, 47,
]

// Ажилтны сүүлийн үйлдлүүд
export const sampleLog = [
  { id: 3, who: 'Ариунаа', what: '3-64 тоотод 40,000₮ бэлэн бүртгэв', at: secondsAgo(900) },
  { id: 2, who: 'Бат-Эрдэнэ', what: 'R-1036 ажлыг эхлүүлэв', at: secondsAgo(1800) },
  { id: 1, who: 'Дорж', what: '«Халуун ус хаагдана» зарлал нийтлэв', at: secondsAgo(3600) },
]

// 12 сарын орлого — GET /api/dashboard/monthly-ийн хариутай ижил хэлбэр (₮)
export const sampleMonths = [
  { period: '2025-12-01', billed: 9800000, collected: 9100000 },
  { period: '2026-01-01', billed: 9800000, collected: 9400000 },
  { period: '2026-02-01', billed: 9800000, collected: 8800000 },
  { period: '2026-03-01', billed: 9800000, collected: 9700000 },
  { period: '2026-04-01', billed: 9800000, collected: 9600000 },
  { period: '2026-05-01', billed: 10200000, collected: 9500000 },
  { period: '2026-06-01', billed: 10200000, collected: 9000000 },
  { period: '2026-07-01', billed: 10200000, collected: 8600000 },
  { period: '2026-08-01', billed: 10200000, collected: 9800000 },
  { period: '2026-09-01', billed: 10200000, collected: 9900000 },
  { period: '2026-10-01', billed: 10200000, collected: 9600000 },
  { period: '2026-11-01', billed: 10200000, collected: 7900000 },
]

// Өр ихтэй тоотууд — GET /api/dashboard/debtors-ийн хариу + name, last_seen (backend-д одоохондоо байхгүй)
export const sampleDebtors = [
  { unit_id: 12, code: '1-12', name: 'Ганболд Т.', debt: 255000, months: 3, last_seen: '18 хоногийн өмнө' },
  { unit_id: 87, code: '3-87', name: 'Сарантуяа Б.', debt: 170000, months: 2, last_seen: 'Одоо онлайн' },
  { unit_id: 31, code: '2-31', name: 'Мөнхбат Э.', debt: 170000, months: 2, last_seen: '2 цагийн өмнө' },
  { unit_id: 5, code: '1-05', name: 'Оюун Д.', debt: 92400, months: 1, last_seen: 'Өчигдөр' },
  { unit_id: 64, code: '3-64', name: 'Тэмүүлэн Г.', debt: 45000, months: 1, last_seen: 'Одоо онлайн' },
  { unit_id: 18, code: '2-18', name: 'Нарантуяа С.', debt: 85000, months: 1, last_seen: '3 хоногийн өмнө' },
]
