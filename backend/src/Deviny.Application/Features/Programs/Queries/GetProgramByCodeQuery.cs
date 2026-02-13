using Deviny.Application.Features.Programs.DTOs;
using MediatR;

namespace Deviny.Application.Features.Programs.Queries;

public class GetProgramByCodeQuery : IRequest<ProgramDto?>
{
    public string Code { get; set; } = string.Empty;
}

