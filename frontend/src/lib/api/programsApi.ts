import { ProgramDto, CreateProgramRequest, UpdateProgramRequest, PublicProgramDto } from '@/types/program';
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

export const programsApi = {
  // Get all public programs for browsing
  getAllPublic: async (): Promise<PublicProgramDto[]> => {
    const response = await fetchWithAuth(`${API_URL}/programs`);
    return handleResponse<PublicProgramDto[]>(response);
  },

  // Get a single public program by ID
  getProgramById: async (id: string): Promise<PublicProgramDto | null> => {
    try {
      const response = await fetchWithAuth(`${API_URL}/programs/${id}`);
      return handleResponse<PublicProgramDto>(response);
    } catch (error) {
      return null;
    }
  },

  // Get trainer's programs
  getMyPrograms: async (): Promise<ProgramDto[]> => {
    const response = await fetchWithAuth(`${API_URL}/trainer/me/programs`);
    return handleResponse<ProgramDto[]>(response);
  },

  // Create program
  createProgram: async (request: CreateProgramRequest): Promise<ProgramDto> => {
    const formData = new FormData();
    formData.append('title', request.title);
    formData.append('description', request.description);
    formData.append('price', request.price.toString());
    formData.append('coverImage', request.coverImage);
    
    if (request.detailedDescription) {
      formData.append('detailedDescription', request.detailedDescription);
    }

    if (request.proPrice != null) {
      formData.append('proPrice', request.proPrice.toString());
    }

    if (request.category) {
      formData.append('category', request.category);
    }

    if (request.trainingVideos && request.trainingVideos.length > 0) {
      request.trainingVideos.forEach((video) => {
        formData.append('trainingVideos', video);
      });
    }

    const response = await fetchWithAuth(`${API_URL}/trainer/me/programs`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<ProgramDto>(response);
  },

  // Update program
  updateProgram: async (id: string, request: UpdateProgramRequest): Promise<ProgramDto> => {
    const formData = new FormData();
    formData.append('title', request.title);
    formData.append('description', request.description);
    formData.append('price', request.price.toString());
    
    if (request.detailedDescription) {
      formData.append('detailedDescription', request.detailedDescription);
    }

    if (request.proPrice != null) {
      formData.append('proPrice', request.proPrice.toString());
    }

    if (request.category) {
      formData.append('category', request.category);
    }

    if (request.coverImage) {
      formData.append('coverImage', request.coverImage);
    }
    if (request.trainingVideos && request.trainingVideos.length > 0) {
      request.trainingVideos.forEach((video) => {
        formData.append('trainingVideos', video);
      });
    }

    const response = await fetchWithAuth(`${API_URL}/trainer/me/programs/${id}`, {
      method: 'PUT',
      body: formData,
    });

    return handleResponse<ProgramDto>(response);
  },

  // Delete program
  deleteProgram: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`${API_URL}/trainer/me/programs/${id}`, {
      method: 'DELETE',
    });
    await handleResponse<void>(response);
  },

  // Get program by code
  getProgramByCode: async (code: string): Promise<ProgramDto | null> => {
    try {
      const response = await fetchWithAuth(`${API_URL}/programs/by-code/${code}`);
      return handleResponse<ProgramDto>(response);
    } catch (error) {
      return null;
    }
  },
};
