// Төлбөр хуудасны жишээ өгөгдөл — backend-тэй ТҮР холбоогүй.

// Энэ сарын нэхэмжлэлийн задаргаа (₮)
export const sampleInvoice = {
  month: 11,
  unit: '45 тоот',
  due: '11/25',
  lines: [
    { name: 'СӨХ хураамж (64 м²)', amount: 44800 },
    { name: 'Лифт', amount: 12000 },
    { name: 'Хамгаалалт, камер', amount: 18000 },
    { name: 'Хог хаягдал', amount: 10200 },
  ],
}

// Орцны гэрэл — нийт айл, одоо төлсөн айл
export const sampleEntranceLight = { units: 30, paid: 23 }

export const sampleBanks = ['Хаан', 'Голомт', 'ХХБ', 'Бусад']

// Өмнөх төлбөрүүд
export const samplePayHistory = [
  { id: 3, month: '10-р сар', date: '10/21', via: 'QPay · Хаан банк', amount: 85000 },
  { id: 2, month: '9-р сар', date: '09/19', via: 'QPay · Хаан банк', amount: 85000 },
  { id: 1, month: '8-р сар', date: '08/24', via: 'Дансаар', amount: 85000 },
]
