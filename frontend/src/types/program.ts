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

// Meal Program types
export interface MealProgramDto {
  id: string;
  title: string;
  description: string;
  price: number;
  code: string;
  coverImageUrl: string;
  videoUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicMealProgramDto {
  id: string;
  title: string;
  description: string;
  price: number;
  code: string;
  coverImageUrl: string;
  videoUrls: string[];
  createdAt: string;
  trainerId: string;
  trainerName: string;
  trainerAvatarUrl: string;
  trainerSlug: string;
}

export interface CreateMealProgramRequest {
  title: string;
  description: string;
  price: number;
  coverImage: File;
  videos: File[];
}

export interface UpdateMealProgramRequest {
  title: string;
  description: string;
  price: number;
  coverImage?: File;
  videos?: File[];
}

// Union type for program type selection
export type ProgramType = 'training' | 'meal';
