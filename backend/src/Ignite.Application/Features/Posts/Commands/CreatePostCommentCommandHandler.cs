using Ignite.Application.Common;
using Ignite.Application.Common.Interfaces;
using Ignite.Application.Features.Posts.DTOs;
using Ignite.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ignite.Application.Features.Posts.Commands;

/// <summary>
/// Handler for creating a comment on a post.
/// </summary>
public class CreatePostCommentCommandHandler : IRequestHandler<CreatePostCommentCommand, Result<PostCommentDto>>
{
    private readonly IUserPostRepository _postRepository;
    private readonly IPostCommentRepository _commentRepository;
    private readonly IUserRepository _userRepository;
    private readonly ILogger<CreatePostCommentCommandHandler> _logger;

    public CreatePostCommentCommandHandler(
        IUserPostRepository postRepository,
        IPostCommentRepository commentRepository,
        IUserRepository userRepository,
        ILogger<CreatePostCommentCommandHandler> logger)
    {
        _postRepository = postRepository;
        _commentRepository = commentRepository;
        _userRepository = userRepository;
        _logger = logger;
    }

    public async Task<Result<PostCommentDto>> Handle(CreatePostCommentCommand request, CancellationToken cancellationToken)
    {
        // Verify post exists and is not deleted
        var post = await _postRepository.GetByIdAsync(request.PostId, cancellationToken);
        if (post == null)
        {
            return Result.Failure<PostCommentDto>(new Error("Post.NotFound", "The post was not found"));
        }

        // Verify parent comment exists if provided
        if (request.ParentCommentId.HasValue)
        {
            var parentComment = await _commentRepository.GetByIdAsync(request.ParentCommentId.Value, cancellationToken);
            if (parentComment == null || parentComment.IsDeleted)
            {
                return Result.Failure<PostCommentDto>(new Error("Comment.ParentNotFound", "The parent comment was not found"));
            }
            
            // Ensure parent comment belongs to the same post
            if (parentComment.PostId != request.PostId)
            {
                return Result.Failure<PostCommentDto>(new Error("Comment.InvalidParent", "The parent comment does not belong to this post"));
            }
        }

        // Get user for response
        var user = await _userRepository.GetByIdAsync(request.UserId);
        if (user == null)
        {
            return Result.Failure<PostCommentDto>(new Error("User.NotFound", "User not found"));
        }

        var now = DateTime.UtcNow;
        var comment = new PostComment
        {
            Id = Guid.NewGuid(),
            PostId = request.PostId,
            UserId = request.UserId,
            Content = request.Content.Trim(),
            ParentCommentId = request.ParentCommentId,
            IsDeleted = false,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _commentRepository.CreateAsync(comment, cancellationToken);

        _logger.LogInformation(
            "User {UserId} commented on post {PostId}",
            request.UserId, request.PostId);

        return Result.Success(new PostCommentDto
        {
            Id = comment.Id,
            PostId = comment.PostId,
            Author = new PostAuthorDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                AvatarUrl = user.AvatarUrl,
                Slug = user.Slug
            },
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            ParentCommentId = comment.ParentCommentId,
            CanDelete = true // Author can always delete their own comment
        });
    }
}
