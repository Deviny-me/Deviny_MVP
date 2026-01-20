const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const token = localStorage.getItem('accessToken')
  
  if (!token) {
    throw new Error('Not authenticated')
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/user/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
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
  const token = localStorage.getItem('accessToken')
  
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/user/avatar`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
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
