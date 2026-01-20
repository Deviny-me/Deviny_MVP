namespace Ignite.Domain.Entities;

public class Specialization : BaseEntity
{
    public required string Name { get; set; } = string.Empty;
    
    public ICollection<TrainerSpecialization> TrainerSpecializations { get; set; } = new List<TrainerSpecialization>();
}
