using MediatR;

namespace Deviny.Application.Features.Notifications.Events;

public class MealProgramCreatedEvent : INotification
{
    public required Guid TrainerId { get; set; }
    public required string TrainerName { get; set; }
    public required Guid ProgramId { get; set; }
    public required string ProgramTitle { get; set; }
}
