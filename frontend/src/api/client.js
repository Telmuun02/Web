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
