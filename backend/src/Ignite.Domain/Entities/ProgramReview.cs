namespace Ignite.Domain.Entities;

public class ProgramReview : BaseEntity
{
    public Guid ProgramId { get; set; }
    public Guid UserId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }

    // Navigation properties
    public TrainingProgram Program { get; set; } = null!;
    public User User { get; set; } = null!;
}
