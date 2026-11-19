// Самбарын үлдсэн жишээ өгөгдөл — DB-д эх сурвалж нь байхгүй хэсгүүд (лифт, дулаан, ус/цахилгаан, камер, онлайн).
// Орлого, төлбөр, хүсэлт, санал хураалт, өр, ажилтны үйлдэл нь GET /api/admin/dashboard-оос ирнэ.

// Апп-д яг одоо онлайн байгаа хүн — нэвтрэлтийн түүх хадгалагддаггүй тул жишээ
export const sampleStats = { online: 47 }

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


// Апп-д онлайн хүний тоо — сүүлийн 30 минут, минут тутам
export const sampleOnline = [
  38, 41, 40, 44, 46, 43, 39, 42, 45, 48, 50, 47, 44, 46, 49,
  52, 55, 51, 48, 46, 44, 47, 50, 53, 49, 46, 45, 48, 47, 47,
]

