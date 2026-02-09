import { ProgramDto, CreateProgramRequest, UpdateProgramRequest, PublicProgramDto } from '@/types/program';
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

  // Handle 204 No Content responses
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return;
  }

  return response.json();
}

export const programsApi = {
  // Get all public programs for browsing
  getAllPublic: async (): Promise<PublicProgramDto[]> => {
    return fetchWithAuth('/programs');
  },

  // Get trainer's programs
  getMyPrograms: async (): Promise<ProgramDto[]> => {
    return fetchWithAuth('/trainer/me/programs');
  },

  // Create program
  createProgram: async (request: CreateProgramRequest): Promise<ProgramDto> => {
    const authHeader = getAuthHeader();
    
    if (!authHeader.Authorization) {
      throw new Error('Not authenticated');
    }

    const formData = new FormData();
    formData.append('title', request.title);
    formData.append('description', request.description);
    formData.append('price', request.price.toString());
    formData.append('coverImage', request.coverImage);
    
    if (request.trainingVideos && request.trainingVideos.length > 0) {
      request.trainingVideos.forEach((video) => {
        formData.append('trainingVideos', video);
      });
    }

    const response = await fetch(`${API_URL}/trainer/me/programs`, {
      method: 'POST',
      headers: {
        ...authHeader,
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Create program error:', errorData);
      throw new Error(errorData.message || errorData.details || 'Failed to create program');
    }

    return response.json();
  },

  // Update program
  updateProgram: async (id: string, request: UpdateProgramRequest): Promise<ProgramDto> => {
    const authHeader = getAuthHeader();
    
    if (!authHeader.Authorization) {
      throw new Error('Not authenticated');
    }

    const formData = new FormData();
    formData.append('title', request.title);
    formData.append('description', request.description);
    formData.append('price', request.price.toString());
    
    if (request.coverImage) {
      formData.append('coverImage', request.coverImage);
    }
    if (request.trainingVideos && request.trainingVideos.length > 0) {
      request.trainingVideos.forEach((video) => {
        formData.append('trainingVideos', video);
      });
    }

    const response = await fetch(`${API_URL}/trainer/me/programs/${id}`, {
      method: 'PUT',
      headers: {
        ...authHeader,
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Update program error:', errorData);
      throw new Error(errorData.message || errorData.details || 'Failed to update program');
    }

    return response.json();
  },

  // Delete program
  deleteProgram: async (id: string): Promise<void> => {
    return fetchWithAuth(`/trainer/me/programs/${id}`, {
      method: 'DELETE',
    });
  },

  // Get program by code
  getProgramByCode: async (code: string): Promise<ProgramDto | null> => {
    try {
      return await fetchWithAuth(`/programs/by-code/${code}`);
    } catch (error) {
      return null;
    }
  },
};
