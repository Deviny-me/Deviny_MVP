import { API_URL, getAuthHeader } from '@/lib/config'

export interface Student {
  id: string
  name: string
  email: string
  phone?: string
  avatarUrl?: string
}

export const studentsApi = {
  async getStudents(): Promise<Student[]> {
    const response = await fetch(`${API_URL}/trainer/me/students`, {
      headers: getAuthHeader(),
    })

    if (!response.ok) throw new Error('Failed to fetch students')
    return response.json()
  },
}
