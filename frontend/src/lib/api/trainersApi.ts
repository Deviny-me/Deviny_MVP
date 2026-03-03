import { PublicTrainerDto } from '@/types/trainer';
import { PagedResponse } from '@/types/pagination';
import { API_URL, fetchWithAuth } from '@/lib/config';

async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await fetchWithAuth(`${API_URL}${url}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Request failed');
  }

  return response.json();
}

export const trainersApi = {
  // Get all trainers for browsing (paginated)
  getAll: async (page = 1, pageSize = 20): Promise<PagedResponse<PublicTrainerDto>> => {
    return apiRequest(`/trainers?page=${page}&pageSize=${pageSize}`);
  },

  // Get trainer profile by slug
  getBySlug: async (slug: string) => {
    return apiRequest(`/trainers/${slug}/profile`);
  },
};
