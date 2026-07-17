import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '@/utils/api'

export interface AuthUser {
  id: number
  name: string
  email: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('api_token') || '')
  const savedUser = localStorage.getItem('auth_user')
  const user = ref<AuthUser | null>(savedUser ? JSON.parse(savedUser) : null)
  const loading = ref(false)
  const error = ref('')

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    loading.value = true
    error.value = ''
    try {
      const res = await api.post('/authentication/login', { email, password })
      const data = res.data

      if (data.token?.access_token) {
        token.value = data.token.access_token
        user.value = data.record || data.user || null
        localStorage.setItem('api_token', data.token.access_token)
        if (user.value) localStorage.setItem('auth_user', JSON.stringify(user.value))
        return true
      }
      error.value = data.message || 'ចូលប្រើប្រាស់មិនបានជោគជ័យ'
      return false
    } catch (err: any) {
      const msg = err.response?.data?.message || 'មិនអាចភ្ជាប់ទៅម៉ាស៊ីនបម្រើបានទេ'
      error.value = msg
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await api.post('/authentication/logout')
    } catch {
      // ignore logout errors
    }
    token.value = ''
    user.value = null
    localStorage.removeItem('api_token')
    localStorage.removeItem('auth_user')
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      const res = await api.get('/authentication/user')
      user.value = res.data?.user || res.data
      if (user.value) localStorage.setItem('auth_user', JSON.stringify(user.value))
    } catch {
      // will be caught by 401 interceptor
    }
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    fetchUser,
  }
})
