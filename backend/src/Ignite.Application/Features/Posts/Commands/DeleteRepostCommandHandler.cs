using Ignite.Application.Common;
using Ignite.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ignite.Application.Features.Posts.Commands;

/// <summary>
/// Handler for deleting (removing) a repost.
/// </summary>
public class DeleteRepostCommandHandler : IRequestHandler<DeleteRepostCommand, Result>
{
    private readonly IUserPostRepository _postRepository;
    private readonly ILogger<DeleteRepostCommandHandler> _logger;

    public DeleteRepostCommandHandler(
        IUserPostRepository postRepository,
        ILogger<DeleteRepostCommandHandler> logger)
    {
        _postRepository = postRepository;
        _logger = logger;
    }

    public async Task<Result> Handle(DeleteRepostCommand request, CancellationToken cancellationToken)
    {
        // Find the user's repost of this original post
        var repost = await _postRepository.GetUserRepostAsync(request.OriginalPostId, request.UserId, cancellationToken);
        
        if (repost == null)
        {
            return Result.Failure(new Error("Repost.NotFound", "You haven't reposted this post"));
        }

        // Soft delete the repost
        await _postRepository.SoftDeleteAsync(repost, cancellationToken);
        
        _logger.LogInformation(
            "User {UserId} removed repost {RepostId} of post {OriginalPostId}",
            request.UserId, repost.Id, request.OriginalPostId);

        return Result.Success();
    }
}
