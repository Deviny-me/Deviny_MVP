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
    private readonly IUserPostRepository _postRepository;
    private readonly ILogger<DeletePostCommentCommandHandler> _logger;

    public DeletePostCommentCommandHandler(
        IPostCommentRepository commentRepository,
        IUserPostRepository postRepository,
        ILogger<DeletePostCommentCommandHandler> logger)
    {
        _commentRepository = commentRepository;
        _postRepository = postRepository;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(DeletePostCommentCommand request, CancellationToken cancellationToken)
    {
        var comment = await _commentRepository.GetByIdAsync(request.CommentId, cancellationToken);
        
        if (comment == null || comment.IsDeleted)
        {
            return Result.Failure<bool>(new Error("Comment.NotFound", "The comment was not found"));
        }

        // Allow delete if user is comment author OR post author
        if (comment.UserId != request.UserId)
        {
            var post = await _postRepository.GetByIdAsync(comment.PostId, cancellationToken);
            if (post == null || post.UserId != request.UserId)
            {
                return Result.Failure<bool>(new Error("Comment.NotOwner", "You can only delete your own comments or comments on your posts"));
            }
        }

        await _commentRepository.SoftDeleteAsync(request.CommentId, cancellationToken);

        _logger.LogInformation(
            "User {UserId} deleted comment {CommentId}",
            request.UserId, request.CommentId);

        return Result.Success(true);
    }
}
