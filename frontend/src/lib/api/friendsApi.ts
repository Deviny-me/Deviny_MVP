import { API_URL, fetchWithAuth } from '@/lib/config';
import { FriendDto, FriendRequestDto } from '@/types/friend';

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchWithAuth(`${API_URL}${endpoint}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const friendsApi = {
  // Send friend request
  sendFriendRequest: async (receiverId: string): Promise<FriendRequestDto> => {
    return apiRequest<FriendRequestDto>('/me/friends/requests', {
      method: 'POST',
      body: JSON.stringify({ receiverId }),
    });
  },

  // Get incoming friend requests
  getIncomingRequests: async (): Promise<FriendRequestDto[]> => {
    return apiRequest<FriendRequestDto[]>('/me/friends/requests/incoming');
  },

  // Get outgoing friend requests
  getOutgoingRequests: async (): Promise<FriendRequestDto[]> => {
    return apiRequest<FriendRequestDto[]>('/me/friends/requests/outgoing');
  },

  // Accept friend request
  acceptFriendRequest: async (requestId: number): Promise<void> => {
    return apiRequest<void>(`/me/friends/requests/${requestId}/accept`, {
      method: 'POST',
    });
  },

  // Decline friend request
  declineFriendRequest: async (requestId: number): Promise<void> => {
    return apiRequest<void>(`/me/friends/requests/${requestId}/decline`, {
      method: 'POST',
    });
  },

  // Cancel friend request
  cancelFriendRequest: async (requestId: number): Promise<void> => {
    return apiRequest<void>(`/me/friends/requests/${requestId}`, {
      method: 'DELETE',
    });
  },

  // Get my friends
  getMyFriends: async (): Promise<FriendDto[]> => {
    return apiRequest<FriendDto[]>('/me/friends');
  },

  // Remove friend
  removeFriend: async (friendId: string): Promise<void> => {
    return apiRequest<void>(`/me/friends/${friendId}`, {
      method: 'DELETE',
    });
  },
};

export const followsApi = {
  // Follow trainer
  followTrainer: async (trainerId: string): Promise<void> => {
    return apiRequest<void>(`/me/follows/${trainerId}`, {
      method: 'POST',
    });
  },

  // Unfollow trainer
  unfollowTrainer: async (trainerId: string): Promise<void> => {
    return apiRequest<void>(`/me/follows/${trainerId}`, {
      method: 'DELETE',
    });
  },

  // Get my following
  getMyFollowing: async (): Promise<FriendDto[]> => {
    return apiRequest<FriendDto[]>('/me/follows');
  },
};

export const blocksApi = {
  // Block user
  blockUser: async (userId: string): Promise<void> => {
    return apiRequest<void>(`/me/blocks/${userId}`, {
      method: 'POST',
    });
  },

  // Unblock user
  unblockUser: async (userId: string): Promise<void> => {
    return apiRequest<void>(`/me/blocks/${userId}`, {
      method: 'DELETE',
    });
  },
};
