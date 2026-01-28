import { API_URL, getAuthHeader } from '@/lib/config'

export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const authHeader = getAuthHeader()
  
  if (!authHeader.Authorization) {
    throw new Error('Not authenticated')
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/user/avatar`, {
    method: 'POST',
    headers: authHeader,
    body: formData,
    credentials: 'include',
  })

  if (response.status === 401) {
    throw new Error('Unauthorized. Please log in again.')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to upload avatar')
  }

  return response.json()
}

export async function deleteAvatar(): Promise<void> {
  const authHeader = getAuthHeader()
  
  if (!authHeader.Authorization) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/user/avatar`, {
    method: 'DELETE',
    headers: authHeader,
    credentials: 'include',
  })

  if (response.status === 401) {
    throw new Error('Unauthorized. Please log in again.')
  }

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to delete avatar')
  }
}
