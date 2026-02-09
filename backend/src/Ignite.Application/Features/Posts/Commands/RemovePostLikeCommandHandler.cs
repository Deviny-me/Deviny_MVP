using Ignite.Application.Common;
using Ignite.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ignite.Application.Features.Posts.Commands;

/// <summary>
/// Handler for removing a like from a post.
/// </summary>
public class RemovePostLikeCommandHandler : IRequestHandler<RemovePostLikeCommand, Result<bool>>
{
    private readonly IPostLikeRepository _likeRepository;
    private readonly ILogger<RemovePostLikeCommandHandler> _logger;

    public RemovePostLikeCommandHandler(
        IPostLikeRepository likeRepository,
        ILogger<RemovePostLikeCommandHandler> logger)
    {
        _likeRepository = likeRepository;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(RemovePostLikeCommand request, CancellationToken cancellationToken)
    {
        var removed = await _likeRepository.RemoveAsync(request.PostId, request.UserId, cancellationToken);
        
        if (!removed)
        {
            return Result.Failure<bool>(new Error("Like.NotFound", "You have not liked this post"));
        }

        _logger.LogInformation(
            "User {UserId} unliked post {PostId}",
            request.UserId, request.PostId);

        return Result.Success(true);
    }
}
