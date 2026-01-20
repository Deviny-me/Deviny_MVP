export interface Student {
  id: string
  name: string
  email: string
  phone?: string
  avatarUrl?: string
}

const API_URL = 'http://localhost:5000/api'

export const studentsApi = {
  async getStudents(): Promise<Student[]> {
    const token = localStorage.getItem('accessToken')

    const response = await fetch(`${API_URL}/trainer/me/students`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) throw new Error('Failed to fetch students')
    return response.json()
  },
}
