/**
 * Post-related types for the frontend.
 * Mirrors backend DTOs for type safety.
 */

export enum PostType {
  Photo = 0,
  Video = 1,
  Achievement = 2,
  Repost = 3
}

export enum MediaType {
  Image = 0,
  Video = 1
}

export enum PostVisibility {
  Public = 0,
  Private = 1
}

/**
 * Basic author information for posts and comments.
 */
export interface PostAuthorDto {
  id: string
  firstName: string
  lastName: string
  avatarUrl?: string | null
  slug?: string | null
  fullName?: string
}

export interface PostMediaDto {
  id: string
  mediaType: MediaType
  url: string
  thumbnailUrl?: string | null
  contentType: string
  sizeBytes: number
  displayOrder: number
}

export interface PostDto {
  id: string
  userId: string
  author?: PostAuthorDto | null
  type: PostType
  caption?: string | null
  visibility: PostVisibility
  createdAt: string
  media: PostMediaDto[]
  
  // Social interaction counts
  likeCount: number
  commentCount: number
  repostCount: number
  
  // Current user's interaction state
  isLikedByMe: boolean
  isRepostedByMe: boolean
  
  // Repost fields
  isRepost?: boolean
  originalPostId?: string | null
  repostQuote?: string | null
  originalPost?: PostDto | null
}

export interface UserPostsResponse {
  posts: PostDto[]
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * Comment on a post.
 */
export interface PostCommentDto {
  id: string
  postId: string
  author: PostAuthorDto
  content: string
  createdAt: string
  parentCommentId?: string | null
}

/**
 * Paginated comments response.
 */
export interface PostCommentsResponse {
  comments: PostCommentDto[]
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface CreateMediaPostRequest {
  file: File
  type: PostType
  caption?: string
}

export interface CreateCommentRequest {
  content: string
  parentCommentId?: string
}

export interface CreateRepostRequest {
  quote?: string
}

export interface CreateMediaPostError {
  type: string
  title: string
  status: number
  errors?: { field: string; message: string }[]
  detail?: string
}
