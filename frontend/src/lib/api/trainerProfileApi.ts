import { TrainerProfileResponse } from '@/types/trainerProfile'

const API_URL = 'http://localhost:5000/api'

export async function fetchTrainerProfile(): Promise<TrainerProfileResponse> {
  const token = localStorage.getItem('accessToken')
  
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/trainer/me/profile`, {
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

  if (response.status === 403) {
    throw new Error('Access denied. Trainer role required.')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to fetch trainer profile')
  }

  const data = await response.json()
  return data
}

export async function uploadCertificate(
  title: string,
  issuer: string,
  year: number,
  file: File
): Promise<void> {
  const token = localStorage.getItem('accessToken')
  
  if (!token) {
    throw new Error('Not authenticated')
  }

  const formData = new FormData()
  formData.append('title', title)
  formData.append('issuer', issuer)
  formData.append('year', year.toString())
  formData.append('file', file)

  const response = await fetch(`${API_URL}/trainer/me/certificates`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: formData,
  })

  if (response.status === 401) {
    throw new Error('Unauthorized. Please log in again.')
  }

  if (response.status === 403) {
    throw new Error('Access denied. Trainer role required.')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to upload certificate')
  }
}

export async function deleteCertificate(certificateId: string): Promise<void> {
  const token = localStorage.getItem('accessToken')
  
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/trainer/me/certificates/${certificateId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  })

  if (response.status === 401) {
    throw new Error('Unauthorized. Please log in again.')
  }

  if (response.status === 403) {
    throw new Error('Access denied. Trainer role required.')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to delete certificate')
  }
}

export async function updateAbout(text: string): Promise<void> {
  const token = localStorage.getItem('accessToken')
  
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/trainer/me/about`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ text }),
  })

  if (response.status === 401) {
    throw new Error('Unauthorized. Please log in again.')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to update about')
  }
}

export async function addSpecialization(name: string): Promise<any> {
  const token = localStorage.getItem('accessToken')
  
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/trainer/me/specializations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ name }),
  })

  if (response.status === 401) {
    throw new Error('Unauthorized. Please log in again.')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to add specialization')
  }

  return response.json()
}

export async function deleteSpecialization(specializationId: string): Promise<void> {
  const token = localStorage.getItem('accessToken')
  
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/trainer/me/specializations/${specializationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  })

  if (response.status === 401) {
    throw new Error('Unauthorized. Please log in again.')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to delete specialization')
  }
}

