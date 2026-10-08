export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
export const TOKEN_KEY = 'token'

export function getToken() {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function clearAuth() {
  if (typeof window === 'undefined' || !window.localStorage) return
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem('fituser')
}
