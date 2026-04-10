using Deviny.Application.Common;
using Deviny.Application.Features.Programs.DTOs;
using Deviny.Application.Features.Programs.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Deviny.API.Controllers;

[Route("api/programs")]
public class ProgramsController : BaseApiController
{
    private readonly IMediator _mediator;

    public ProgramsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all public programs for browsing (paginated)
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResponse<PublicProgramDto>>> GetAllPublic(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] double? minRating = null,
        [FromQuery] string? tier = null,
        [FromQuery] int? minSales = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 1;
        if (pageSize > 100) pageSize = 100;

        var query = new GetAllPublicProgramsQuery(page, pageSize, minPrice, maxPrice, minRating, tier, minSales);
        var programs = await _mediator.Send(query);
        return Ok(programs);
    }

    /// <summary>
    /// Get a single public program by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<PublicProgramDto>> GetById(Guid id)
    {
        var query = new GetPublicProgramByIdQuery { Id = id };
        var program = await _mediator.Send(query);

        if (program == null)
            return NotFound(new { message = "Программа не найдена" });

        return Ok(program);
    }

    [HttpGet("by-code/{code}")]
    [AllowAnonymous]
    public async Task<ActionResult<ProgramDto>> GetByCode(string code)
    {
        var query = new GetProgramByCodeQuery { Code = code };
        var program = await _mediator.Send(query);

        if (program == null)
            return NotFound(new { message = "Программа не найдена" });

        return Ok(program);
    }
}
