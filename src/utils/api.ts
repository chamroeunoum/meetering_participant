import axios from 'axios'

const API_SERVER = import.meta.env.VITE_API_SERVER || '/api/admin'

const api = axios.create({
  baseURL: API_SERVER,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// Request interceptor — inject Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('api_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — handle 401 (token expired/invalid)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('api_token')
      // Only redirect if not already on the login page
      if (!window.location.pathname.includes('/officer/login')) {
        window.location.href = '/officer/login'
      }
    }
    return Promise.reject(err)
  },
)

export default api
