using Deviny.Application.Features.Programs.DTOs;
using MediatR;

namespace Deviny.Application.Features.Programs.Queries;

public class GetMyProgramsQuery : IRequest<List<ProgramDto>>
{
    public Guid TrainerId { get; set; }
}

