import { Navigate, Outlet } from 'react-router-dom'
import { homePath } from '../utils/home'

// Route-ийн хамгаалалт — зөвхөн тухайн role-той хэрэглэгчийг оруулна.
// Өөр role-той бол өөрийнх нь нүүр рүү буцаана (оршин суугч /admin руу орох гэвэл → /)
// Санамж: энэ нь зөвхөн хуудсыг нуудаг. API-г хамгаалах шалгалт backend дээр байх ёстой
export default function RequireRole({ user, role }) {
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={homePath(user)} replace />
  return <Outlet />
}
