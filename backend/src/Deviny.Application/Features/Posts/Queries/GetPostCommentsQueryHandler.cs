using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Posts.DTOs;
using MediatR;

namespace Deviny.Application.Features.Posts.Queries;

/// <summary>
/// Handler for getting comments for a post.
/// </summary>
public class GetPostCommentsQueryHandler : IRequestHandler<GetPostCommentsQuery, PostCommentsResponse>
{
    private readonly IPostCommentRepository _commentRepository;
    private readonly IUserPostRepository _postRepository;

    public GetPostCommentsQueryHandler(
        IPostCommentRepository commentRepository,
        IUserPostRepository postRepository)
    {
        _commentRepository = commentRepository;
        _postRepository = postRepository;
    }

    public async Task<PostCommentsResponse> Handle(GetPostCommentsQuery request, CancellationToken cancellationToken)
    {
        var comments = await _commentRepository.GetByPostIdPagedAsync(
            request.PostId, 
            request.Page, 
            request.PageSize, 
            cancellationToken);
        
        var totalCount = await _commentRepository.GetCountByPostIdAsync(request.PostId, cancellationToken);

        // Get post author to determine canDelete for post owner
        Guid? postAuthorId = null;
        if (request.CurrentUserId.HasValue)
        {
            var post = await _postRepository.GetByIdAsync(request.PostId, cancellationToken);
            postAuthorId = post?.UserId;
        }

        var commentDtos = comments.Select(c => new PostCommentDto
        {
            Id = c.Id,
            PostId = c.PostId,
            Author = new PostAuthorDto
            {
                Id = c.User.Id,
                FirstName = c.User.FirstName,
                LastName = c.User.LastName,
                AvatarUrl = c.User.AvatarUrl,
                Slug = c.User.Slug
            },
            Content = c.Content,
            CreatedAt = c.CreatedAt,
            ParentCommentId = c.ParentCommentId,
            CanDelete = request.CurrentUserId.HasValue && 
                (c.UserId == request.CurrentUserId.Value || postAuthorId == request.CurrentUserId.Value)
        }).ToList();

        return new PostCommentsResponse
        {
            Comments = commentDtos,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}
