import { PublicTrainerDto } from '@/types/trainer';
import { API_URL, getAuthHeader } from '@/lib/config';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const authHeader = getAuthHeader();
  
  if (!authHeader.Authorization) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...authHeader,
      ...options.headers,
    },
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new Error('Unauthorized. Please log in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Request failed');
  }

  return response.json();
}

export const trainersApi = {
  // Get all trainers for browsing
  getAll: async (): Promise<PublicTrainerDto[]> => {
    return fetchWithAuth('/trainers');
  },
};
