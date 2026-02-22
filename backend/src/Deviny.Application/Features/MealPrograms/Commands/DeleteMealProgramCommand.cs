using MediatR;

namespace Deviny.Application.Features.MealPrograms.Commands;

public class DeleteMealProgramCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
    public Guid TrainerId { get; set; }
}
