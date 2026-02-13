namespace Deviny.Domain.Entities;

public class TrainerSpecialization
{
    public required Guid TrainerId { get; set; }
    public TrainerProfile Trainer { get; set; } = null!;
    
    public required Guid SpecializationId { get; set; }
    public Specialization Specialization { get; set; } = null!;
}
