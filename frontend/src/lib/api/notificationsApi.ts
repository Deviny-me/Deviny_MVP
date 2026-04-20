import { API_URL, fetchWithAuth } from '@/lib/config';
import { NotificationSettings, NotificationsResponse } from '@/types/notification';

export const notificationsApi = {
  async getNotifications(cursor?: string, limit: number = 50): Promise<NotificationsResponse> {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    params.set('limit', limit.toString());

    const response = await fetchWithAuth(`${API_URL}/me/notifications?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    return response.json();
  },

  async getUnreadCount(): Promise<number> {
    const response = await fetchWithAuth(`${API_URL}/me/notifications/unread-count`);
    if (!response.ok) {
      throw new Error('Failed to fetch unread count');
    }
    return response.json();
  },

  async markAsRead(id: string): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/me/notifications/${id}/read`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
  },

  async markAllAsRead(): Promise<{ count: number }> {
    const response = await fetchWithAuth(`${API_URL}/me/notifications/read-all`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }
    return response.json();
  },

  async getSettings(): Promise<NotificationSettings> {
    const response = await fetchWithAuth(`${API_URL}/me/settings/notifications`);
    if (!response.ok) {
      throw new Error('Failed to fetch notification settings');
    }
    return response.json();
  },

  async updateSettings(payload: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await fetchWithAuth(`${API_URL}/me/settings/notifications`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Failed to update notification settings');
    }
    return response.json();
  },
};
