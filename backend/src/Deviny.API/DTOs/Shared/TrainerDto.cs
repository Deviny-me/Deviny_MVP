namespace Deviny.API.DTOs.Shared;

public class TrainerDto
{
    public required Guid Id { get; set; }
    public required Guid UserId { get; set; }
    public required string FullName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? BannerUrl { get; set; }
    public required string Initials { get; set; }
    public string? PrimaryTitle { get; set; }
    public string? SecondaryTitle { get; set; }
    public string? Location { get; set; }
    public string? Gender { get; set; }
    public string? Phone { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public int? ExperienceYears { get; set; }
    public required int ProgramsCount { get; set; }
    public required int StudentsCount { get; set; }
    public required int AchievementsCount { get; set; }
    public required decimal RatingValue { get; set; }
    public required decimal ActivityRatingValue { get; set; } = 0;
    public required int ReviewsCount { get; set; }
    public required string Slug { get; set; }
    public required string ProfilePublicUrl { get; set; }
    public string? Role { get; set; }
    public FeedbackDto? Feedback { get; set; }
}

