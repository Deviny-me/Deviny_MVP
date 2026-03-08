using Deviny.Domain.Enums;

namespace Deviny.Domain.Entities;

public class ProgramReview : BaseEntity
{
    public Guid? TrainingProgramId { get; set; }
    public Guid? MealProgramId { get; set; }
    public Guid UserId { get; set; }
    public ProgramType ProgramType { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }

    // Navigation properties
    public TrainingProgram? TrainingProgram { get; set; }
    public MealProgram? MealProgram { get; set; }
    public User User { get; set; } = null!;
}
