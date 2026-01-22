using Ignite.Application.Features.Programs.DTOs;
using Ignite.Application.Features.Programs.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ignite.API.Controllers;

[ApiController]
[Route("api/programs")]
[Authorize]
public class ProgramsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProgramsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("by-code/{code}")]
    public async Task<ActionResult<ProgramDto>> GetByCode(string code)
    {
        var query = new GetProgramByCodeQuery { Code = code };
        var program = await _mediator.Send(query);

        if (program == null)
            return NotFound(new { message = "Программа не найдена" });

        return Ok(program);
    }
}
