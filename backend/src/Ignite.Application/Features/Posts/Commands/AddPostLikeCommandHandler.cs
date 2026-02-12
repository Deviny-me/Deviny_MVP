using Ignite.Application.Common;
using Ignite.Application.Common.Interfaces;
using Ignite.Application.Features.Posts.DTOs;
using Ignite.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ignite.Application.Features.Posts.Commands;

/// <summary>
/// Handler for adding a like to a post.
/// Returns updated PostStatsDto for frontend reconciliation.
/// </summary>
public class AddPostLikeCommandHandler : IRequestHandler<AddPostLikeCommand, Result<PostStatsDto>>
{
    private readonly IUserPostRepository _postRepository;
    private readonly IPostLikeRepository _likeRepository;
    private readonly IPostCommentRepository _commentRepository;
    private readonly ILogger<AddPostLikeCommandHandler> _logger;

    public AddPostLikeCommandHandler(
        IUserPostRepository postRepository,
        IPostLikeRepository likeRepository,
        IPostCommentRepository commentRepository,
        ILogger<AddPostLikeCommandHandler> logger)
    {
        _postRepository = postRepository;
        _likeRepository = likeRepository;
        _commentRepository = commentRepository;
        _logger = logger;
    }

    public async Task<Result<PostStatsDto>> Handle(AddPostLikeCommand request, CancellationToken cancellationToken)
    {
        // Verify post exists and is not deleted
        var post = await _postRepository.GetByIdAsync(request.PostId, cancellationToken);
        if (post == null)
        {
            return Result.Failure<PostStatsDto>(new Error("Post.NotFound", "The post was not found"));
        }

        // Check if already liked (idempotent)
        var alreadyLiked = await _likeRepository.ExistsAsync(request.PostId, request.UserId, cancellationToken);
        if (!alreadyLiked)
        {
            var like = new PostLike
            {
                PostId = request.PostId,
                UserId = request.UserId,
                CreatedAt = DateTime.UtcNow
            };

            await _likeRepository.AddAsync(like, cancellationToken);
        }

        _logger.LogInformation("User {UserId} liked post {PostId}", request.UserId, request.PostId);

        // Return fresh stats
        var stats = await BuildPostStatsAsync(request.PostId, request.UserId, cancellationToken);
        return Result.Success(stats);
    }

    private async Task<PostStatsDto> BuildPostStatsAsync(Guid postId, Guid userId, CancellationToken ct)
    {
        var likeCount = await _likeRepository.GetCountAsync(postId, ct);
        var commentCount = await _commentRepository.GetCountByPostIdAsync(postId, ct);
        var repostCount = await _postRepository.GetRepostCountAsync(postId, ct);
        var isLiked = await _likeRepository.ExistsAsync(postId, userId, ct);
        var isReposted = await _postRepository.HasUserRepostedAsync(postId, userId, ct);

        return new PostStatsDto
        {
            LikeCount = likeCount,
            CommentCount = commentCount,
            RepostCount = repostCount,
            IsLikedByMe = isLiked,
            IsRepostedByMe = isReposted
        };
    }
}
