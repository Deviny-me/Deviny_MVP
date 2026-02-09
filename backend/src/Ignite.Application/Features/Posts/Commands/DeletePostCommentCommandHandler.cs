using Ignite.Application.Common;
using Ignite.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ignite.Application.Features.Posts.Commands;

/// <summary>
/// Handler for deleting a comment (soft delete).
/// </summary>
public class DeletePostCommentCommandHandler : IRequestHandler<DeletePostCommentCommand, Result<bool>>
{
    private readonly IPostCommentRepository _commentRepository;
    private readonly ILogger<DeletePostCommentCommandHandler> _logger;

    public DeletePostCommentCommandHandler(
        IPostCommentRepository commentRepository,
        ILogger<DeletePostCommentCommandHandler> logger)
    {
        _commentRepository = commentRepository;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(DeletePostCommentCommand request, CancellationToken cancellationToken)
    {
        var comment = await _commentRepository.GetByIdAsync(request.CommentId, cancellationToken);
        
        if (comment == null || comment.IsDeleted)
        {
            return Result.Failure<bool>(new Error("Comment.NotFound", "The comment was not found"));
        }

        // Only the author can delete the comment
        if (comment.UserId != request.UserId)
        {
            return Result.Failure<bool>(new Error("Comment.NotOwner", "You can only delete your own comments"));
        }

        await _commentRepository.SoftDeleteAsync(request.CommentId, cancellationToken);

        _logger.LogInformation(
            "User {UserId} deleted comment {CommentId}",
            request.UserId, request.CommentId);

        return Result.Success(true);
    }
}
