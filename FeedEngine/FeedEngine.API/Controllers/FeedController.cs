using FeedEngine.Domain.Models;
using FeedEngine.Domain.Services;
using Microsoft.AspNetCore.Mvc;

namespace FeedEngine.API.Controllers;

[ApiController]
[Route("feed")]
public class FeedController : ControllerBase
{
    private readonly IFeedService _feedService;

    public FeedController(IFeedService feedService)
    {
        _feedService = feedService;
    }

    /// <summary>
    /// Personalized "For You" feed.
    /// </summary>
    [HttpGet("fyp")]
    public async Task<ActionResult<FeedPage<FeedItem>>> GetFyp(
        [FromQuery] Guid userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery(Name = "q")] string? query = null,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
        {
            return BadRequest("userId is required");
        }

        var feed = await _feedService.GetFypAsync(userId, page, pageSize, query, cancellationToken);
        return Ok(feed);
    }

    /// <summary>
    /// Explore feed (trending / global).
    /// </summary>
    [HttpGet("explore")]
    public async Task<ActionResult<FeedPage<FeedItem>>> GetExplore(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery(Name = "q")] string? query = null,
        CancellationToken cancellationToken = default)
    {
        var feed = await _feedService.GetExploreAsync(page, pageSize, query, cancellationToken);
        return Ok(feed);
    }
}
