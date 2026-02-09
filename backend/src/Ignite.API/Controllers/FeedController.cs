using Ignite.Application.Features.Posts.DTOs;
using Ignite.Application.Features.Posts.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Ignite.API.Controllers;

/// <summary>
/// Controller for the feed of posts.
/// </summary>
[Route("api/feed")]
public class FeedController : BaseApiController
{
    private readonly IMediator _mediator;

    public FeedController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get the feed of posts.
    /// Returns public posts sorted by date descending.
    /// </summary>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Posts per page (default: 20, max: 100)</param>
    [HttpGet]
    [ProducesResponseType(typeof(UserPostsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserPostsResponse>> GetFeed(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        pageSize = Math.Min(pageSize, 100);
        var userId = GetUserId();

        var query = new GetFeedQuery
        {
            CurrentUserId = userId,
            Page = page,
            PageSize = pageSize
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }
    
    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) 
            ?? User.FindFirst("sub")
            ?? User.FindFirst("userId");

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return null;
        }

        return userId;
    }
}
