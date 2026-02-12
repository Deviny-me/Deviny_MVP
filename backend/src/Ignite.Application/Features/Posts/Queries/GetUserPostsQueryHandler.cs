using Ignite.Application.Common;
using Ignite.Application.Common.Interfaces;
using Ignite.Application.Features.Posts.DTOs;
using Ignite.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ignite.Application.Features.Posts.Queries;

/// <summary>
/// Handler for GetUserPostsQuery.
/// Retrieves paginated posts for a target user, applying visibility rules:
/// - If target == current user: show all (including private)
/// - Otherwise: show only public posts.
/// </summary>
public class GetUserPostsQueryHandler
    : IRequestHandler<GetUserPostsQuery, Result<UserPostsResponse>>
{
    private readonly IUserPostRepository _postRepository;
    private readonly IPostLikeRepository _likeRepository;
    private readonly IPostCommentRepository _commentRepository;
    private readonly IFileStorageService _fileStorage;
    private readonly ILogger<GetUserPostsQueryHandler> _logger;

    public GetUserPostsQueryHandler(
        IUserPostRepository postRepository,
        IPostLikeRepository likeRepository,
        IPostCommentRepository commentRepository,
        IFileStorageService fileStorage,
        ILogger<GetUserPostsQueryHandler> logger)
    {
        _postRepository = postRepository;
        _likeRepository = likeRepository;
        _commentRepository = commentRepository;
        _fileStorage = fileStorage;
        _logger = logger;
    }

    public async Task<Result<UserPostsResponse>> Handle(
        GetUserPostsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var page = Math.Max(1, request.Page);
            var pageSize = Math.Clamp(request.PageSize, 1, 100);
            var isOwnProfile = request.CurrentUserId.HasValue
                && request.CurrentUserId.Value == request.TargetUserId;

            // Choose method based on whether we're viewing our own or another user's posts
            List<UserPost> posts;
            int totalCount;

            if (isOwnProfile)
            {
                totalCount = await _postRepository.GetCountByUserIdAsync(
                    request.TargetUserId, request.Tab, cancellationToken);
                posts = await _postRepository.GetByUserIdPagedAsync(
                    request.TargetUserId, request.Tab, page, pageSize, cancellationToken);
            }
            else
            {
                totalCount = await _postRepository.GetPublicCountByUserIdAsync(
                    request.TargetUserId, request.Tab, cancellationToken);
                posts = await _postRepository.GetPublicByUserIdPagedAsync(
                    request.TargetUserId, request.Tab, page, pageSize, cancellationToken);
            }

            // Collect all post IDs (including originals for reposts)
            var allPostIds = posts.Select(p => p.Id).ToList();
            var originalPostIds = posts
                .Where(p => p.OriginalPostId.HasValue && p.OriginalPost != null)
                .Select(p => p.OriginalPostId!.Value)
                .Distinct()
                .ToList();
            allPostIds.AddRange(originalPostIds);

            // Batch fetch counts
            var commentCounts = await _commentRepository.GetCountsForPostsAsync(allPostIds, cancellationToken);
            var repostCounts = await _postRepository.GetRepostCountsForPostsAsync(allPostIds, cancellationToken);
            var likeCounts = await _likeRepository.GetLikeCountsForPostsAsync(allPostIds, cancellationToken);

            // Viewer flags (if authenticated)
            var likedPostIds = new HashSet<Guid>();
            var repostedPostIds = new HashSet<Guid>();
            if (request.CurrentUserId.HasValue)
            {
                likedPostIds = await _likeRepository.GetLikedPostIdsAsync(
                    allPostIds, request.CurrentUserId.Value, cancellationToken);
                repostedPostIds = await _postRepository.GetRepostedPostIdsByUserAsync(
                    allPostIds, request.CurrentUserId.Value, cancellationToken);
            }

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

            return Result.Success(new UserPostsResponse
            {
                Posts = postDtos,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get posts for user {UserId}", request.TargetUserId);
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
                Slug = post.User.Slug
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
