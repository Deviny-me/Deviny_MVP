using Deviny.Application.Common;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Posts.DTOs;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Deviny.Application.Features.Posts.Commands;

/// <summary>
/// Handler for deleting (removing) a repost.
/// Returns updated PostStatsDto for the original post.
/// </summary>
public class DeleteRepostCommandHandler : IRequestHandler<DeleteRepostCommand, Result<PostStatsDto>>
{
    private readonly IUserPostRepository _postRepository;
    private readonly IPostLikeRepository _likeRepository;
    private readonly IPostCommentRepository _commentRepository;
    private readonly ILogger<DeleteRepostCommandHandler> _logger;

    public DeleteRepostCommandHandler(
        IUserPostRepository postRepository,
        IPostLikeRepository likeRepository,
        IPostCommentRepository commentRepository,
        ILogger<DeleteRepostCommandHandler> logger)
    {
        _postRepository = postRepository;
        _likeRepository = likeRepository;
        _commentRepository = commentRepository;
        _logger = logger;
    }

    public async Task<Result<PostStatsDto>> Handle(DeleteRepostCommand request, CancellationToken cancellationToken)
    {
        // Find the user's repost of this original post
        var repost = await _postRepository.GetUserRepostAsync(request.OriginalPostId, request.UserId, cancellationToken);
        
        if (repost == null)
        {
            return Result.Failure<PostStatsDto>(new Error("Repost.NotFound", "You haven't reposted this post"));
        }

        // Soft delete the repost
        await _postRepository.SoftDeleteAsync(repost, cancellationToken);
        
        _logger.LogInformation(
            "User {UserId} removed repost {RepostId} of post {OriginalPostId}",
            request.UserId, repost.Id, request.OriginalPostId);

        // Return fresh stats for the original post
        var likeCount = await _likeRepository.GetCountAsync(request.OriginalPostId, cancellationToken);
        var commentCount = await _commentRepository.GetCountByPostIdAsync(request.OriginalPostId, cancellationToken);
        var repostCount = await _postRepository.GetRepostCountAsync(request.OriginalPostId, cancellationToken);
        var isLiked = await _likeRepository.ExistsAsync(request.OriginalPostId, request.UserId, cancellationToken);
        var isReposted = await _postRepository.HasUserRepostedAsync(request.OriginalPostId, request.UserId, cancellationToken);

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
