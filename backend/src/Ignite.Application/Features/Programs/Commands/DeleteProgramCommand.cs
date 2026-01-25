using MediatR;

namespace Ignite.Application.Features.Programs.Commands;

public class DeleteProgramCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
    public Guid TrainerId { get; set; }
}

