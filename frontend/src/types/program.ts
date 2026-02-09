export interface ProgramDto {
  id: string;
  trainerId: string;
  title: string;
  description: string;
  price: number;
  code: string;
  coverImageUrl: string;
  trainingVideoUrls: string[];
  createdAt: string;
  updatedAt: string;
  averageRating: number;
  totalReviews: number;
  totalPurchases: number;
}

// Public program for browsing (includes trainer info)
export interface PublicProgramDto {
  id: string;
  title: string;
  description: string;
  price: number;
  code: string;
  coverImageUrl: string;
  averageRating: number;
  totalReviews: number;
  totalPurchases: number;
  createdAt: string;
  trainerId: string;
  trainerName: string;
  trainerAvatarUrl: string;
  trainerSlug: string;
}

export interface CreateProgramRequest {
  title: string;
  description: string;
  price: number;
  coverImage: File;
  trainingVideos: File[];
}

export interface UpdateProgramRequest {
  title: string;
  description: string;
  price: number;
  coverImage?: File;
  trainingVideos?: File[];
}
