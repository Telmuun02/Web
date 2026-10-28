// Нэвтрэлттэй холбоотой API дуудлагууд.
// Түр хувилбар — backend бэлэн болохоор доорх функцуудын дотрыг fetch('/api/auth/...')-ээр солино.
// Хуудсууд зөвхөн эдгээр функцийг дууддаг тул тэр үед хуудсыг өөрчлөх шаардлагагүй.

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Баталгаажуулах код илгээх — POST /api/auth/forgot-password { login }
// Бүртгэлгүй хаяг байсан ч ижил хариу буцаана (хэн бүртгэлтэйг таахаас сэргийлнэ)
export async function requestPasswordReset(login) {
  await wait(600)
  return { channel: login.includes('@') ? 'email' : 'sms' }
}

// Код шалгаад шинэ нууц үг тохируулах — POST /api/auth/reset-password { login, code, password }
// Түр хувилбарт 123456 л зөв код
export async function resetPassword({ code }) {
  await wait(600)
  if (code !== '123456') throw new Error('Баталгаажуулах код буруу эсвэл хугацаа нь дууссан байна')
}
