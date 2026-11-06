// Оршин суугчийн профайлын жишээ өгөгдөл — backend-тэй ТҮР холбоогүй.

export const sampleResident = {
  place: '2-р орц · 45 тоот · Өмчлөгч',
  onTimeMonths: 4, // төлбөрөө цагтаа төлсөн сар
}

// app — апп суулгасан эсэх
export const sampleFamily = [
  { id: 1, name: 'Болор А.', role: 'Өмчлөгч · та', app: true },
  { id: 2, name: 'Төгөлдөр Б.', role: 'Гэр бүл', app: true },
  { id: 3, name: 'Анужин Т.', role: 'Гэр бүл · хүүхэд', app: false },
]

// Мэдэгдлийн тохиргоо — on: анхдагч утга
export const sampleNotifySettings = [
  { key: 'avatar', label: 'Хуралд аватартай орох', hint: 'Нүүр тань анхдагчаар нууцлагдана', on: true },
  { key: 'pay', label: 'Төлбөрийн сануулга', hint: 'Хугацаанаас 3 хоногийн өмнө · SMS', on: true },
  { key: 'meeting', label: 'Хурлын сануулга', hint: '1 цагийн өмнө · апп ба имэйл', on: true },
  { key: 'news', label: 'Шинэ зарлал', hint: 'Чухал зарлал үргэлж ирнэ', on: false },
]

export const fontSizes = [
  { value: 's', label: 'Жижиг', px: 14 },
  { value: 'm', label: 'Дунд', px: 16 },
  { value: 'l', label: 'Том', px: 19 },
]
