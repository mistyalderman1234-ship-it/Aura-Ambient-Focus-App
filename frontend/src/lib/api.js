import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

const API = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

API.interceptors.response.use(
  r => r,
  err => {
    const message = err?.response?.data?.error || err?.response?.data?.message || err.message
    return Promise.reject({ ...err, userMessage: message })
  }
)

export default API
