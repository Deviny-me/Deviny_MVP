export interface FriendDto {
  id: string;
  email: string;
  fullName?: string;
  avatar?: string;
  friendsSince: string;
}

export interface FriendRequestDto {
  id: number;
  senderId: string;
  senderEmail: string;
  senderFullName?: string;
  senderAvatar?: string;
  receiverId: string;
  receiverEmail: string;
  receiverFullName?: string;
  receiverAvatar?: string;
  status: FriendRequestStatus;
  createdAt: string;
  respondedAt?: string;
}

export enum FriendRequestStatus {
  Pending = 0,
  Accepted = 1,
  Declined = 2,
  Cancelled = 3,
}
