// Хэрэглэгч бүрийн "нүүр" хуудас — нэвтэрсний дараа, эсвэл өөр хэсэгт орох гэвэл энд буцаана
export function homePath(user) {
  return user?.role === 'admin' ? '/admin' : '/'
}
