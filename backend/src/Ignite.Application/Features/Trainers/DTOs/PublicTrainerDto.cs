namespace Ignite.Application.Features.Trainers.DTOs;

public class PublicTrainerDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public string? PrimaryTitle { get; set; }
    public string? SecondaryTitle { get; set; }
    public string? Location { get; set; }
    public int? ExperienceYears { get; set; }
    public string Slug { get; set; } = string.Empty;
    public int ProgramsCount { get; set; }
    public List<string> Specializations { get; set; } = new();
}
