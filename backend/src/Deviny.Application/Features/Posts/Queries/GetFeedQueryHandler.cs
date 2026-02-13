using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Posts.DTOs;
using MediatR;

namespace Deviny.Application.Features.Posts.Queries;

/// <summary>
/// Handler for getting the feed of posts.
/// </summary>
public class GetFeedQueryHandler : IRequestHandler<GetFeedQuery, UserPostsResponse>
{
    private readonly IUserPostRepository _postRepository;
    private readonly IPostLikeRepository _likeRepository;
    private readonly IPostCommentRepository _commentRepository;
    private readonly IFileStorageService _fileStorage;

    public GetFeedQueryHandler(
        IUserPostRepository postRepository,
        IPostLikeRepository likeRepository,
        IPostCommentRepository commentRepository,
        IFileStorageService fileStorage)
    {
        _postRepository = postRepository;
        _likeRepository = likeRepository;
        _commentRepository = commentRepository;
        _fileStorage = fileStorage;
    }

    public async Task<UserPostsResponse> Handle(GetFeedQuery request, CancellationToken cancellationToken)
    {
        var posts = await _postRepository.GetFeedPagedAsync(request.Page, request.PageSize, cancellationToken);
        var totalCount = await _postRepository.GetFeedCountAsync(cancellationToken);

        if (!posts.Any())
        {
            return new UserPostsResponse
            {
                Posts = new(),
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };
        }

        // Collect all post IDs (including original posts for reposts)
        var allPostIds = posts.Select(p => p.Id).ToList();
        var originalPostIds = posts
            .Where(p => p.OriginalPostId.HasValue)
            .Select(p => p.OriginalPostId!.Value)
            .Distinct()
            .ToList();
        allPostIds.AddRange(originalPostIds);

        // Get counts and user interactions in batch
        var commentCounts = await _commentRepository.GetCountsForPostsAsync(allPostIds, cancellationToken);
        var repostCounts = await _postRepository.GetRepostCountsForPostsAsync(allPostIds, cancellationToken);
        var likeCounts = await _likeRepository.GetLikeCountsForPostsAsync(allPostIds, cancellationToken);
        
        HashSet<Guid> likedPostIds = new();
        HashSet<Guid> repostedPostIds = new();
        
        if (request.CurrentUserId.HasValue)
        {
            likedPostIds = await _likeRepository.GetLikedPostIdsAsync(allPostIds, request.CurrentUserId.Value, cancellationToken);
            repostedPostIds = await _postRepository.GetRepostedPostIdsByUserAsync(allPostIds, request.CurrentUserId.Value, cancellationToken);
        }

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

        return new UserPostsResponse
        {
            Posts = postDtos,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    private PostDto MapToDto(
        Domain.Entities.UserPost post,
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
                ThumbnailUrl = m.ThumbnailPath != null ? _fileStorage.GetPublicUrl(m.ThumbnailPath) : null,
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
