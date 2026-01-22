using Ignite.Application.Common.Interfaces;
using MediatR;

namespace Ignite.Application.Features.Programs.Commands;

public class DeleteProgramCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
    public Guid TrainerId { get; set; }
}

public class DeleteProgramCommandHandler : IRequestHandler<DeleteProgramCommand, Unit>
{
    private readonly IProgramRepository _programRepository;

    public DeleteProgramCommandHandler(IProgramRepository programRepository)
    {
        _programRepository = programRepository;
    }

    public async Task<Unit> Handle(DeleteProgramCommand request, CancellationToken cancellationToken)
    {
        var program = await _programRepository.GetByIdAsync(request.Id);
        
        if (program == null)
        {
            throw new KeyNotFoundException("Программа не найдена");
        }

        if (program.TrainerId != request.TrainerId)
        {
            throw new UnauthorizedAccessException("Нет доступа к этой программе");
        }

        program.IsDeleted = true;
        program.DeletedAt = DateTime.UtcNow;
        program.UpdatedAt = DateTime.UtcNow;

        await _programRepository.UpdateAsync(program);

        return Unit.Value;
    }
}
