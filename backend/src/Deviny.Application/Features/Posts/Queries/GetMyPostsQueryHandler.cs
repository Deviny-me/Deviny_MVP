using Deviny.Application.Common;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Posts.DTOs;
using Deviny.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Deviny.Application.Features.Posts.Queries;

/// <summary>
/// Handler for GetMyPostsQuery.
/// Retrieves paginated posts for the current user.
/// </summary>
public class GetMyPostsQueryHandler 
    : IRequestHandler<GetMyPostsQuery, Result<UserPostsResponse>>
{
    private readonly IUserPostRepository _postRepository;
    private readonly IPostLikeRepository _likeRepository;
    private readonly IPostCommentRepository _commentRepository;
    private readonly IFileStorageService _fileStorage;
    private readonly ILogger<GetMyPostsQueryHandler> _logger;

    public GetMyPostsQueryHandler(
        IUserPostRepository postRepository,
        IPostLikeRepository likeRepository,
        IPostCommentRepository commentRepository,
        IFileStorageService fileStorage,
        ILogger<GetMyPostsQueryHandler> logger)
    {
        _postRepository = postRepository;
        _likeRepository = likeRepository;
        _commentRepository = commentRepository;
        _fileStorage = fileStorage;
        _logger = logger;
    }

    public async Task<Result<UserPostsResponse>> Handle(
        GetMyPostsQuery request, 
        CancellationToken cancellationToken)
    {
        try
        {
            // Normalize pagination parameters
            var page = Math.Max(1, request.Page);
            var pageSize = Math.Clamp(request.PageSize, 1, 100);

            // Get total count
            var totalCount = await _postRepository.GetCountByUserIdAsync(
                request.UserId, request.Tab, cancellationToken);

            // Get paginated posts
            var posts = await _postRepository.GetByUserIdPagedAsync(
                request.UserId, request.Tab, page, pageSize, cancellationToken);

            // Collect all post IDs (including original posts for reposts)
            var allPostIds = posts.Select(p => p.Id).ToList();
            var originalPostIds = posts
                .Where(p => p.OriginalPostId.HasValue && p.OriginalPost != null)
                .Select(p => p.OriginalPostId!.Value)
                .Distinct()
                .ToList();
            allPostIds.AddRange(originalPostIds);

            // Get counts and user interactions in batch
            var commentCounts = await _commentRepository.GetCountsForPostsAsync(allPostIds, cancellationToken);
            var repostCounts = await _postRepository.GetRepostCountsForPostsAsync(allPostIds, cancellationToken);
            var likeCounts = await _likeRepository.GetLikeCountsForPostsAsync(allPostIds, cancellationToken);

            // Check which posts the user has liked/reposted
            var likedPostIds = await _likeRepository.GetLikedPostIdsAsync(allPostIds, request.UserId, cancellationToken);
            var repostedPostIds = await _postRepository.GetRepostedPostIdsByUserAsync(allPostIds, request.UserId, cancellationToken);

            // Map to DTOs
            var postDtos = posts.Select(p => MapToDto(
                p,
                likeCounts.GetValueOrDefault(p.Id, 0),
                commentCounts.GetValueOrDefault(p.Id, 0),
                repostCounts.GetValueOrDefault(p.Id, 0),
                likedPostIds.Contains(p.Id),
                repostedPostIds.Contains(p.Id),
                p.OriginalPost != null && !p.OriginalPost.IsDeleted ? MapToDto(
                    p.OriginalPost,
                    likeCounts.GetValueOrDefault(p.OriginalPost.Id, 0),
                    commentCounts.GetValueOrDefault(p.OriginalPost.Id, 0),
                    repostCounts.GetValueOrDefault(p.OriginalPost.Id, 0),
                    likedPostIds.Contains(p.OriginalPost.Id),
                    repostedPostIds.Contains(p.OriginalPost.Id),
                    null
                ) : null
            )).ToList();

            var response = new UserPostsResponse
            {
                Posts = postDtos,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };

            return Result.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get posts for user {UserId}", request.UserId);
            return Result.Failure<UserPostsResponse>(
                Error.Custom("Posts.QueryFailed", "Failed to retrieve posts."));
        }
    }

    private PostDto MapToDto(
        UserPost post,
        int likeCount,
        int commentCount,
        int repostCount,
        bool isLikedByMe,
        bool isRepostedByMe,
        PostDto? originalPost)
    {
        return new PostDto
        {
            Id = post.Id,
            UserId = post.UserId,
            Author = post.User != null ? new PostAuthorDto
            {
                Id = post.User.Id,
                FirstName = post.User.FirstName,
                LastName = post.User.LastName,
                AvatarUrl = post.User.AvatarUrl,
                Slug = post.User.Slug,
                Role = post.User.Role
            } : null,
            Type = post.Type,
            Caption = post.Caption,
            Visibility = post.Visibility,
            CreatedAt = post.CreatedAt,
            Media = post.Media.Select(m => new PostMediaDto
            {
                Id = m.Id,
                MediaType = m.MediaType,
                Url = _fileStorage.GetPublicUrl(m.FilePath),
                ThumbnailUrl = m.ThumbnailPath != null 
                    ? _fileStorage.GetPublicUrl(m.ThumbnailPath) 
                    : null,
                ContentType = m.ContentType,
                SizeBytes = m.SizeBytes,
                DisplayOrder = m.DisplayOrder
            }).ToList(),
            LikeCount = likeCount,
            CommentCount = commentCount,
            RepostCount = repostCount,
            IsLikedByMe = isLikedByMe,
            IsRepostedByMe = isRepostedByMe,
            OriginalPostId = post.OriginalPostId,
            RepostQuote = post.RepostQuote,
            OriginalPost = originalPost
        };
    }
}
