using Deviny.Application.Features.Challenges.Queries;
using Deviny.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Deviny.API.Controllers;

[Route("api/me/challenges")]
public class MeChallengesController : BaseApiController
{
    private readonly IMediator _mediator;

    public MeChallengesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get current user's challenges with progress.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMyChallenges(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var roleStr = GetCurrentUserRole();
        var role = Enum.TryParse<UserRole>(roleStr, true, out var parsed) ? parsed : UserRole.User;

        var result = await _mediator.Send(new GetMyChallengesQuery { UserId = userId, UserRole = role }, ct);
        return Ok(result);
    }
}
