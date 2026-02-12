using Ignite.Application.Common;
using Ignite.Application.Common.Interfaces;
using Ignite.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ignite.Application.Features.Posts.Commands;

/// <summary>
/// Handler for deleting a user's post.
/// </summary>
public class DeleteUserPostCommandHandler : IRequestHandler<DeleteUserPostCommand, Result<bool>>
{
    private readonly IUserPostRepository _postRepository;
    private readonly ILogger<DeleteUserPostCommandHandler> _logger;

    public DeleteUserPostCommandHandler(
        IUserPostRepository postRepository,
        ILogger<DeleteUserPostCommandHandler> logger)
    {
        _postRepository = postRepository;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(DeleteUserPostCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Get the post for deletion - use GetByIdForDeleteAsync which allows soft-deleted posts
            // This is important for reposts whose original post was deleted
            var post = await _postRepository.GetByIdForDeleteAsync(request.PostId, request.UserId, cancellationToken);
            
            if (post == null)
            {
                // Either post doesn't exist or user doesn't own it
                return Result.Failure<bool>(new Error("Post.NotFound", "Post not found or you don't have permission to delete it"));
            }
            
            // If already soft-deleted, return success (idempotent behavior)
            if (post.IsDeleted)
            {
                _logger.LogInformation(
                    "Post {PostId} was already deleted, returning success",
                    request.PostId);
                return Result.Success(true);
            }

            // Soft delete the post (reposts remain with "deleted" placeholder)
            await _postRepository.SoftDeleteAsync(post, cancellationToken);
            
            _logger.LogInformation(
                "User {UserId} soft-deleted post {PostId}",
                request.UserId,
                request.PostId);

            return Result.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting post {PostId} for user {UserId}", 
                request.PostId, request.UserId);
            
            return Result.Failure<bool>(new Error(
                "Post.DeleteFailed",
                "Failed to delete post"));
        }
    }
}
