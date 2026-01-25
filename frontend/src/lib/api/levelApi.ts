import { UserLevelDto } from '@/types/level'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export async function getMyLevel(): Promise<UserLevelDto> {
  const token = localStorage.getItem('accessToken')
  
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/me/level`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })

  if (response.status === 401) {
    throw new Error('Unauthorized. Please log in again.')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to fetch level')
  }

  return response.json()
}
