using Deviny.Application.DTOs.Search;
using Deviny.Application.Features.Search.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Deviny.API.Controllers;

[Route("api/search")]
public class SearchController : BaseApiController
{
    private readonly IMediator _mediator;

    public SearchController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Global search across users, workout programs, and meal programs.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<GlobalSearchResponse>> Search(
        [FromQuery] string query,
        [FromQuery] int limit = 5)
    {
        var result = await _mediator.Send(new GlobalSearchQuery(query, limit));
        return Ok(result);
    }
}
