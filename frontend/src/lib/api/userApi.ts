import { API_URL, fetchWithAuth } from '@/lib/config'

export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetchWithAuth(`${API_URL}/user/avatar`, {
    method: 'POST',
    body: formData,
    headers: {}, // Don't set Content-Type for FormData
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to upload avatar')
  }

  return response.json()
}

export async function deleteAvatar(): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/user/avatar`, {
    method: 'DELETE',
  })

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to delete avatar')
  }
}
