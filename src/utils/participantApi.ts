import axios from 'axios'

const API_SERVER = import.meta.env.VITE_API_SERVER?.replace('/admin', '/participant') || '/api/participant'

const participantApi = axios.create({
  baseURL: API_SERVER,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

export default participantApi
