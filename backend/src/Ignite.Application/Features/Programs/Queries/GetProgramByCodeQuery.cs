using Ignite.Application.Features.Programs.DTOs;
using MediatR;

namespace Ignite.Application.Features.Programs.Queries;

public class GetProgramByCodeQuery : IRequest<ProgramDto?>
{
    public string Code { get; set; } = string.Empty;
}

