using Ignite.Application.Features.Programs.DTOs;
using MediatR;

namespace Ignite.Application.Features.Programs.Queries;

public class GetMyProgramsQuery : IRequest<List<ProgramDto>>
{
    public Guid TrainerId { get; set; }
}

