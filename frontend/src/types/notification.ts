export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationsResponse {
  items: Notification[];
  unreadCount: number;
  nextCursor: string | null;
}
