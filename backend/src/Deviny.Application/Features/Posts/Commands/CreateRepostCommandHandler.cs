using Deviny.Application.Common;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Posts.DTOs;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Deviny.Application.Features.Posts.Commands;

/// <summary>
/// Handler for creating a repost of another user's post.
/// </summary>
public class CreateRepostCommandHandler : IRequestHandler<CreateRepostCommand, Result<PostDto>>
{
    private readonly IUserPostRepository _postRepository;
    private readonly IPostLikeRepository _likeRepository;
    private readonly IPostCommentRepository _commentRepository;
    private readonly IUserRepository _userRepository;
    private readonly IFileStorageService _fileStorage;
    private readonly ILevelService _levelService;
    private readonly ILogger<CreateRepostCommandHandler> _logger;

    public CreateRepostCommandHandler(
        IUserPostRepository postRepository,
        IPostLikeRepository likeRepository,
        IPostCommentRepository commentRepository,
        IUserRepository userRepository,
        IFileStorageService fileStorage,
        ILevelService levelService,
        ILogger<CreateRepostCommandHandler> logger)
    {
        _postRepository = postRepository;
        _likeRepository = likeRepository;
        _commentRepository = commentRepository;
        _userRepository = userRepository;
        _fileStorage = fileStorage;
        _levelService = levelService;
        _logger = logger;
    }

    public async Task<Result<PostDto>> Handle(CreateRepostCommand request, CancellationToken cancellationToken)
    {
        // Verify original post exists and is not deleted
        var originalPost = await _postRepository.GetByIdAsync(request.OriginalPostId, cancellationToken);
        if (originalPost == null)
        {
            return Result.Failure<PostDto>(new Error("Post.NotFound", "The original post was not found"));
        }

        // Can't repost a repost - find the root original post
        var targetOriginalId = originalPost.OriginalPostId ?? originalPost.Id;
        if (originalPost.OriginalPostId.HasValue)
        {
            var rootPost = await _postRepository.GetByIdAsync(targetOriginalId, cancellationToken);
            if (rootPost == null)
            {
                return Result.Failure<PostDto>(new Error("Post.NotFound", "The original post was not found"));
            }
            originalPost = rootPost;
        }

        // Check if user already reposted this post
        var hasReposted = await _postRepository.HasUserRepostedAsync(originalPost.Id, request.UserId, cancellationToken);
        if (hasReposted)
        {
            return Result.Failure<PostDto>(new Error("Repost.AlreadyExists", "You have already reposted this post"));
        }

        // Get user for response
        var user = await _userRepository.GetByIdAsync(request.UserId);
        if (user == null)
        {
            return Result.Failure<PostDto>(new Error("User.NotFound", "User not found"));
        }

        var now = DateTime.UtcNow;
        var repost = new UserPost
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Type = PostType.Repost,
            Caption = null,
            Visibility = PostVisibility.Public,
            OriginalPostId = originalPost.Id,
            RepostQuote = request.Quote?.Trim(),
            IsDeleted = false,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _postRepository.CreateAsync(repost, cancellationToken);

        // Award XP for creating a repost
        try
        {
            var xpEventType = user.Role == UserRole.Trainer 
                ? XpEventType.TrainerCreatedPost 
                : XpEventType.UserCreatedPost;
            
            await _levelService.AddXpAsync(
                request.UserId,
                xpEventType,
                5, // 5 XP for repost (less than original post)
                $"CreatedRepost:{repost.Id}",
                repost.Id
            );
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to award XP for repost creation");
        }

        _logger.LogInformation(
            "User {UserId} reposted post {OriginalPostId} as {RepostId}",
            request.UserId, originalPost.Id, repost.Id);

        // Build response
        var likeCount = await _likeRepository.GetCountAsync(repost.Id, cancellationToken);
        var commentCount = await _commentRepository.GetCountByPostIdAsync(repost.Id, cancellationToken);
        var repostCount = await _postRepository.GetRepostCountAsync(repost.Id, cancellationToken);
        var originalLikeCount = await _likeRepository.GetCountAsync(originalPost.Id, cancellationToken);
        var originalCommentCount = await _commentRepository.GetCountByPostIdAsync(originalPost.Id, cancellationToken);
        var originalRepostCount = await _postRepository.GetRepostCountAsync(originalPost.Id, cancellationToken);

        return Result.Success(new PostDto
        {
            Id = repost.Id,
            UserId = repost.UserId,
            Author = new PostAuthorDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                AvatarUrl = user.AvatarUrl,
                Slug = user.Slug
            },
            Type = repost.Type,
            Caption = repost.Caption,
            Visibility = repost.Visibility,
            CreatedAt = repost.CreatedAt,
            Media = new(),
            LikeCount = likeCount,
            CommentCount = commentCount,
            RepostCount = repostCount,
            IsLikedByMe = false,
            IsRepostedByMe = false,
            OriginalPostId = repost.OriginalPostId,
            RepostQuote = repost.RepostQuote,
            OriginalPost = new PostDto
            {
                Id = originalPost.Id,
                UserId = originalPost.UserId,
                Author = originalPost.User != null ? new PostAuthorDto
                {
                    Id = originalPost.User.Id,
                    FirstName = originalPost.User.FirstName,
                    LastName = originalPost.User.LastName,
                    AvatarUrl = originalPost.User.AvatarUrl,
                    Slug = originalPost.User.Slug
                } : null,
                Type = originalPost.Type,
                Caption = originalPost.Caption,
                Visibility = originalPost.Visibility,
                CreatedAt = originalPost.CreatedAt,
                Media = originalPost.Media.Select(m => new PostMediaDto
                {
                    Id = m.Id,
                    MediaType = m.MediaType,
                    Url = _fileStorage.GetPublicUrl(m.FilePath),
                    ThumbnailUrl = m.ThumbnailPath != null ? _fileStorage.GetPublicUrl(m.ThumbnailPath) : null,
                    ContentType = m.ContentType,
                    SizeBytes = m.SizeBytes,
                    DisplayOrder = m.DisplayOrder
                }).ToList(),
                LikeCount = originalLikeCount,
                CommentCount = originalCommentCount,
                RepostCount = originalRepostCount
            }
        });
    }
}
