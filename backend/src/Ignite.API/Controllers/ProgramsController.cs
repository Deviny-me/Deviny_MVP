using Ignite.Application.Features.Programs.DTOs;
using Ignite.Application.Features.Programs.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ignite.API.Controllers;

[Route("api/programs")]
public class ProgramsController : BaseApiController
{
    private readonly IMediator _mediator;

    public ProgramsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all public programs for browsing
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<PublicProgramDto>>> GetAllPublic()
    {
        var query = new GetAllPublicProgramsQuery();
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
