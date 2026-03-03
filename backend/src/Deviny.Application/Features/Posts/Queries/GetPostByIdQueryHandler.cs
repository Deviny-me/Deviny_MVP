using Deviny.Application.Common;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Posts.DTOs;
using MediatR;

namespace Deviny.Application.Features.Posts.Queries;

/// <summary>
/// Handler for getting a single post by ID.
/// </summary>
public class GetPostByIdQueryHandler : IRequestHandler<GetPostByIdQuery, Result<PostDto>>
{
    private readonly IUserPostRepository _postRepository;
    private readonly IPostLikeRepository _likeRepository;
    private readonly IPostCommentRepository _commentRepository;
    private readonly IFileStorageService _fileStorage;

    public GetPostByIdQueryHandler(
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

    public async Task<Result<PostDto>> Handle(GetPostByIdQuery request, CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdAsync(request.PostId, cancellationToken);
        
        if (post == null)
        {
            return Result.Failure<PostDto>(new Error("Post.NotFound", "The post was not found"));
        }

        // Collect all post IDs we need stats for (main + optional original)
        var postIds = new List<Guid> { post.Id };
        if (post.OriginalPost != null && !post.OriginalPost.IsDeleted)
        {
            postIds.Add(post.OriginalPost.Id);
        }

        // Batch-fetch all counts in parallel (2-3 queries total instead of 6-10)
        var likeCountsTask = _likeRepository.GetLikeCountsForPostsAsync(postIds, cancellationToken);
        var commentCountsTask = _commentRepository.GetCountsForPostsAsync(postIds, cancellationToken);
        var repostCountsTask = _postRepository.GetRepostCountsForPostsAsync(postIds, cancellationToken);

        await Task.WhenAll(likeCountsTask, commentCountsTask, repostCountsTask);

        var likeCounts = likeCountsTask.Result;
        var commentCounts = commentCountsTask.Result;
        var repostCounts = repostCountsTask.Result;

        // Batch-fetch user interactions
        HashSet<Guid> likedIds = new();
        HashSet<Guid> repostedIds = new();
        if (request.CurrentUserId.HasValue)
        {
            var likedTask = _likeRepository.GetLikedPostIdsAsync(postIds, request.CurrentUserId.Value, cancellationToken);
            var repostedTask = _postRepository.GetRepostedPostIdsByUserAsync(postIds, request.CurrentUserId.Value, cancellationToken);
            await Task.WhenAll(likedTask, repostedTask);
            likedIds = likedTask.Result;
            repostedIds = repostedTask.Result;
        }

        // Build original post DTO if needed
        PostDto? originalPostDto = null;
        if (post.OriginalPost != null && !post.OriginalPost.IsDeleted)
        {
            var opId = post.OriginalPost.Id;
            originalPostDto = MapToDto(
                post.OriginalPost,
                likeCounts.GetValueOrDefault(opId),
                commentCounts.GetValueOrDefault(opId),
                repostCounts.GetValueOrDefault(opId),
                likedIds.Contains(opId),
                repostedIds.Contains(opId),
                null
            );
        }

        return Result.Success(MapToDto(
            post,
            likeCounts.GetValueOrDefault(post.Id),
            commentCounts.GetValueOrDefault(post.Id),
            repostCounts.GetValueOrDefault(post.Id),
            likedIds.Contains(post.Id),
            repostedIds.Contains(post.Id),
            originalPostDto
        ));
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
