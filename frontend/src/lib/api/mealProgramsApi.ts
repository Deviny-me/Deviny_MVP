import { MealProgramDto, PublicMealProgramDto, CreateMealProgramRequest, UpdateMealProgramRequest } from '@/types/program';
import { API_URL, fetchWithAuth } from '@/lib/config';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.details || 'Request failed');
  }

  // Handle 204 No Content responses
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return response.json();
}

export const mealProgramsApi = {
  // Get all public meal programs
  getAllPublic: async (): Promise<PublicMealProgramDto[]> => {
    const response = await fetchWithAuth(`${API_URL}/meal-programs`);
    return handleResponse<PublicMealProgramDto[]>(response);
  },

  // Get trainer's/nutritionist's own meal programs
  getMyMealPrograms: async (): Promise<MealProgramDto[]> => {
    const response = await fetchWithAuth(`${API_URL}/trainer/me/meal-programs`);
    return handleResponse<MealProgramDto[]>(response);
  },

  // Create meal program
  createMealProgram: async (request: CreateMealProgramRequest): Promise<MealProgramDto> => {
    const formData = new FormData();
    formData.append('title', request.title);
    formData.append('description', request.description);
    formData.append('price', request.price.toString());
    formData.append('coverImage', request.coverImage);

    if (request.videos && request.videos.length > 0) {
      request.videos.forEach(video => {
        formData.append('videos', video);
      });
    }

    const response = await fetchWithAuth(`${API_URL}/trainer/me/meal-programs`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<MealProgramDto>(response);
  },

  // Update meal program
  updateMealProgram: async (id: string, request: UpdateMealProgramRequest): Promise<MealProgramDto> => {
    const formData = new FormData();
    formData.append('title', request.title);
    formData.append('description', request.description);
    formData.append('price', request.price.toString());
    
    if (request.coverImage) {
      formData.append('coverImage', request.coverImage);
    }

    if (request.videos && request.videos.length > 0) {
      request.videos.forEach(video => {
        formData.append('videos', video);
      });
    }

    const response = await fetchWithAuth(`${API_URL}/trainer/me/meal-programs/${id}`, {
      method: 'PUT',
      body: formData,
    });

    return handleResponse<MealProgramDto>(response);
  },

  // Delete meal program
  deleteMealProgram: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`${API_URL}/trainer/me/meal-programs/${id}`, {
      method: 'DELETE',
    });
    await handleResponse<void>(response);
  },
};
