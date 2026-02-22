using Deviny.Application.Common.Interfaces;
using MediatR;

namespace Deviny.Application.Features.MealPrograms.Commands;

public class DeleteMealProgramCommandHandler : IRequestHandler<DeleteMealProgramCommand, Unit>
{
    private readonly IMealProgramRepository _mealProgramRepository;

    public DeleteMealProgramCommandHandler(IMealProgramRepository mealProgramRepository)
    {
        _mealProgramRepository = mealProgramRepository;
    }

    public async Task<Unit> Handle(DeleteMealProgramCommand request, CancellationToken ct)
    {
        var program = await _mealProgramRepository.GetByIdAsync(request.Id, ct);

        if (program == null)
            throw new KeyNotFoundException("Программа питания не найдена");

        if (program.TrainerId != request.TrainerId)
            throw new UnauthorizedAccessException("Нет доступа к этой программе");

        program.IsDeleted = true;
        program.DeletedAt = DateTime.UtcNow;
        program.UpdatedAt = DateTime.UtcNow;

        await _mealProgramRepository.UpdateAsync(program, ct);

        return Unit.Value;
    }
}
