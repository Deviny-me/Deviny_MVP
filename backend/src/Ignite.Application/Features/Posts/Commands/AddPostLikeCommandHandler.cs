using Ignite.Application.Common;
using Ignite.Application.Common.Interfaces;
using Ignite.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ignite.Application.Features.Posts.Commands;

/// <summary>
/// Handler for adding a like to a post.
/// </summary>
public class AddPostLikeCommandHandler : IRequestHandler<AddPostLikeCommand, Result<bool>>
{
    private readonly IUserPostRepository _postRepository;
    private readonly IPostLikeRepository _likeRepository;
    private readonly ILogger<AddPostLikeCommandHandler> _logger;

    public AddPostLikeCommandHandler(
        IUserPostRepository postRepository,
        IPostLikeRepository likeRepository,
        ILogger<AddPostLikeCommandHandler> logger)
    {
        _postRepository = postRepository;
        _likeRepository = likeRepository;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(AddPostLikeCommand request, CancellationToken cancellationToken)
    {
        // Verify post exists and is not deleted
        var post = await _postRepository.GetByIdAsync(request.PostId, cancellationToken);
        if (post == null)
        {
            return Result.Failure<bool>(new Error("Post.NotFound", "The post was not found"));
        }

        // Check if already liked
        var alreadyLiked = await _likeRepository.ExistsAsync(request.PostId, request.UserId, cancellationToken);
        if (alreadyLiked)
        {
            return Result.Failure<bool>(new Error("Like.AlreadyExists", "You have already liked this post"));
        }

        // Add like
        var like = new PostLike
        {
            PostId = request.PostId,
            UserId = request.UserId,
            CreatedAt = DateTime.UtcNow
        };

        await _likeRepository.AddAsync(like, cancellationToken);

        _logger.LogInformation(
            "User {UserId} liked post {PostId}",
            request.UserId, request.PostId);

        return Result.Success(true);
    }
}
