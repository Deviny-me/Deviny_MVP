namespace Deviny.Application.Features.Levels.DTOs;

public class UserRatingDto
{
    public int Level { get; set; }
    public int CompletedProgramsCount { get; set; }
    public int CompletedChallengesCount { get; set; }
    public int AchievementsCount { get; set; }
    /// <summary>
    /// Aggregated user rating in range 0-100.
    /// </summary>
    public double RatingValue { get; set; }
}

