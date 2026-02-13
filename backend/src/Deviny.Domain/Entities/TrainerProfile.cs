namespace Deviny.Domain.Entities;

public class TrainerProfile : BaseEntity
{
    public required Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public string? PrimaryTitle { get; set; }
    public string? SecondaryTitle { get; set; }
    public string? Location { get; set; }
    public int? ExperienceYears { get; set; }
    public string? AboutText { get; set; }
    public required string Slug { get; set; } = string.Empty;
    public int ProgramsCount { get; set; } = 0;
    
    public Guid? GymBroId { get; set; }
    public User? GymBro { get; set; }
    
    public ICollection<TrainerCertificate> Certificates { get; set; } = new List<TrainerCertificate>();
    public ICollection<TrainerAchievement> Achievements { get; set; } = new List<TrainerAchievement>();
    public ICollection<TrainerSpecialization> Specializations { get; set; } = new List<TrainerSpecialization>();
}
