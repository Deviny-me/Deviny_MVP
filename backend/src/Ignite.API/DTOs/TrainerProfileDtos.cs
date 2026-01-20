namespace Ignite.API.DTOs;

public class TrainerProfileResponse
{
    public required TrainerDto Trainer { get; set; }
    public required AboutDto About { get; set; }
    public required List<CertificateDto> Certificates { get; set; }
    public required List<AchievementDto> Achievements { get; set; }
    public required List<SpecializationDto> Specializations { get; set; }
}

public class TrainerDto
{
    public required Guid Id { get; set; }
    public required string FullName { get; set; }
    public string? AvatarUrl { get; set; }
    public required string Initials { get; set; }
    public string? PrimaryTitle { get; set; }
    public string? SecondaryTitle { get; set; }
    public string? Location { get; set; }
    public int? ExperienceYears { get; set; }
    public required int ProgramsCount { get; set; }
    public required int StudentsCount { get; set; }
    public required int AchievementsCount { get; set; }
    public required decimal RatingValue { get; set; }
    public required int ReviewsCount { get; set; }
    public required string Slug { get; set; }
    public required string ProfilePublicUrl { get; set; }
}

public class AboutDto
{
    public string? Text { get; set; }
}

public class CertificateDto
{
    public required Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Issuer { get; set; }
    public required int Year { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
}

public class AchievementDto
{
    public required Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Subtitle { get; set; }
    public required string IconKey { get; set; }
    public required string Tone { get; set; }
}

public class SpecializationDto
{
    public required Guid Id { get; set; }
    public required string Name { get; set; }
}
