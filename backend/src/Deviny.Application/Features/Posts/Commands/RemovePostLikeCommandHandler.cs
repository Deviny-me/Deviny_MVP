using Deviny.Application.Common;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Posts.DTOs;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Deviny.Application.Features.Posts.Commands;

/// <summary>
/// Handler for removing a like from a post.
/// Returns updated PostStatsDto for frontend reconciliation.
/// </summary>
public class RemovePostLikeCommandHandler : IRequestHandler<RemovePostLikeCommand, Result<PostStatsDto>>
{
    private readonly IUserPostRepository _postRepository;
    private readonly IPostLikeRepository _likeRepository;
    private readonly IPostCommentRepository _commentRepository;
    private readonly ILogger<RemovePostLikeCommandHandler> _logger;

    public RemovePostLikeCommandHandler(
        IUserPostRepository postRepository,
        IPostLikeRepository likeRepository,
        IPostCommentRepository commentRepository,
        ILogger<RemovePostLikeCommandHandler> logger)
    {
        _postRepository = postRepository;
        _likeRepository = likeRepository;
        _commentRepository = commentRepository;
        _logger = logger;
    }

    public async Task<Result<PostStatsDto>> Handle(RemovePostLikeCommand request, CancellationToken cancellationToken)
    {
        // Remove like (idempotent — if not liked, still return stats)
        await _likeRepository.RemoveAsync(request.PostId, request.UserId, cancellationToken);

        _logger.LogInformation("User {UserId} unliked post {PostId}", request.UserId, request.PostId);

        // Return fresh stats
        var likeCount = await _likeRepository.GetCountAsync(request.PostId, cancellationToken);
        var commentCount = await _commentRepository.GetCountByPostIdAsync(request.PostId, cancellationToken);
        var repostCount = await _postRepository.GetRepostCountAsync(request.PostId, cancellationToken);
        var isLiked = await _likeRepository.ExistsAsync(request.PostId, request.UserId, cancellationToken);
        var isReposted = await _postRepository.HasUserRepostedAsync(request.PostId, request.UserId, cancellationToken);

        return Result.Success(new PostStatsDto
        {
            LikeCount = likeCount,
            CommentCount = commentCount,
            RepostCount = repostCount,
            IsLikedByMe = isLiked,
            IsRepostedByMe = isReposted
        });
    }
}
