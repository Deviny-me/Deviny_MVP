// Centralized API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
export const API_URL = `${API_BASE_URL}/api`

// Helper to get auth header
export function getAuthHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Helper to build full URL
export function buildUrl(path: string): string {
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`
}
