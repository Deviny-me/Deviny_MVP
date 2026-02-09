using Ignite.Application.Common.Interfaces;
using Ignite.Application.Features.Posts.DTOs;
using MediatR;

namespace Ignite.Application.Features.Posts.Queries;

/// <summary>
/// Handler for getting comments for a post.
/// </summary>
public class GetPostCommentsQueryHandler : IRequestHandler<GetPostCommentsQuery, PostCommentsResponse>
{
    private readonly IPostCommentRepository _commentRepository;

    public GetPostCommentsQueryHandler(IPostCommentRepository commentRepository)
    {
        _commentRepository = commentRepository;
    }

    public async Task<PostCommentsResponse> Handle(GetPostCommentsQuery request, CancellationToken cancellationToken)
    {
        var comments = await _commentRepository.GetByPostIdPagedAsync(
            request.PostId, 
            request.Page, 
            request.PageSize, 
            cancellationToken);
        
        var totalCount = await _commentRepository.GetCountByPostIdAsync(request.PostId, cancellationToken);

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
            ParentCommentId = c.ParentCommentId
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
