/**
 * Самбарын "Анхааруулга" — лифт, камер, дулааны мэдрэгч DB-д холбогдоогүй тул түр жишээ.
 * Төлөлт, орлого, хүсэлт, төлбөр, өр, санал хураалт нь GET /api/admin/dashboard-оос бодит ирнэ.
 * kind: 'lift' | 'cam' | 'heat', minutesAgo — хэдэн минутын өмнө үүссэн
 */

export const sampleAlerts = [
  { id: 'lift', kind: 'lift', title: '3-р орцны лифт зогссон', note: 'Засварчин ирж байна', minutesAgo: 25 },
  { id: 'cam', kind: 'cam', title: 'Хогийн цэгийн камер тасарсан', note: 'Сүлжээ алга', minutesAgo: 4 },
  { id: 'heat', kind: 'heat', title: '3-р орцны дулаан 19.6°C', note: 'Хэвийн нь 20–24°C', minutesAgo: 60 },
]
