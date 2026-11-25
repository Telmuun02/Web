/**
 * Backend-тэй ярих axios — бүх хүсэлт /api-аас эхэлнэ, cookie (нэвтрэлт) хамт явна.
 * Хариуны data-г шууд буцаана: api.get('/x') → өгөгдөл.
 * Алдаа гарвал backend-ийн { error } мессежтэй Error шиднэ (err.message, err.status)
 */

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.error || 'Сервертэй холбогдож чадсангүй'
    const error = new Error(message)
    error.status = err.response?.status
    return Promise.reject(error)
  },
)

export default api
