using Ignite.Application.Common;
using Ignite.Application.Common.Interfaces;
using Ignite.Application.Features.Posts.DTOs;
using MediatR;

namespace Ignite.Application.Features.Posts.Queries;

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

        // Get counts
        var likeCount = await _likeRepository.GetCountAsync(post.Id, cancellationToken);
        var commentCount = await _commentRepository.GetCountByPostIdAsync(post.Id, cancellationToken);
        var repostCount = await _postRepository.GetRepostCountAsync(post.Id, cancellationToken);

        // Get user interactions
        var isLikedByMe = false;
        var isRepostedByMe = false;
        
        if (request.CurrentUserId.HasValue)
        {
            isLikedByMe = await _likeRepository.ExistsAsync(post.Id, request.CurrentUserId.Value, cancellationToken);
            isRepostedByMe = await _postRepository.HasUserRepostedAsync(post.Id, request.CurrentUserId.Value, cancellationToken);
        }

        // Get original post data if this is a repost
        PostDto? originalPostDto = null;
        if (post.OriginalPost != null && !post.OriginalPost.IsDeleted)
        {
            var originalLikeCount = await _likeRepository.GetCountAsync(post.OriginalPost.Id, cancellationToken);
            var originalCommentCount = await _commentRepository.GetCountByPostIdAsync(post.OriginalPost.Id, cancellationToken);
            var originalRepostCount = await _postRepository.GetRepostCountAsync(post.OriginalPost.Id, cancellationToken);
            
            var originalIsLikedByMe = false;
            var originalIsRepostedByMe = false;
            
            if (request.CurrentUserId.HasValue)
            {
                originalIsLikedByMe = await _likeRepository.ExistsAsync(post.OriginalPost.Id, request.CurrentUserId.Value, cancellationToken);
                originalIsRepostedByMe = await _postRepository.HasUserRepostedAsync(post.OriginalPost.Id, request.CurrentUserId.Value, cancellationToken);
            }

            originalPostDto = MapToDto(
                post.OriginalPost,
                originalLikeCount,
                originalCommentCount,
                originalRepostCount,
                originalIsLikedByMe,
                originalIsRepostedByMe,
                null
            );
        }

        return Result.Success(MapToDto(
            post,
            likeCount,
            commentCount,
            repostCount,
            isLikedByMe,
            isRepostedByMe,
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
