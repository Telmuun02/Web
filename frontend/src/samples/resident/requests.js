// Санал хүсэлт хуудасны жишээ өгөгдөл — backend-тэй ТҮР холбоогүй.

// Хүсэлтийн төрөл — tint: үсгийн дэвсгэр өнгө
export const requestTypes = [
  { id: 'fix', label: 'Засвар', tint: '#ffe7b0' },
  { id: 'complaint', label: 'Гомдол', tint: '#fde1dd' },
  { id: 'idea', label: 'Санал', tint: '#ddf3e8' },
  { id: 'other', label: 'Бусад', tint: '#eceaf5' },
]

export const requestSteps = ['Илгээсэн', 'Хүлээн авсан', 'Хийгдэж байна', 'Шийдсэн']

// step — хэд дэх алхам хүртэл явсан (1–4)
export const sampleMyRequests = [
  { id: 3, type: 'fix', title: 'Угаалгын өрөөнд ус гоожиж байна', when: '11/13', step: 3, note: 'Засварчин Баярсайхан өнөөдөр 15:00-д очно' },
  { id: 2, type: 'idea', title: 'Орцонд дугуйн зогсоол хэрэгтэй', when: '11/02', step: 2, note: 'Ээлжит хурлын хэлэлцэх асуудалд орлоо' },
  { id: 1, type: 'complaint', title: 'Шөнө хашаанд машин дуут дохио', when: '10/21', step: 4, note: 'Харуулд үүрэг өгсөн. Шийдвэрлэгдсэн.' },
]
