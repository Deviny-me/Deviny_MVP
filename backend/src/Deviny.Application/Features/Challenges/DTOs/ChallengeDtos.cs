using Deviny.Domain.Enums;

namespace Deviny.Application.Features.Challenges.DTOs;

public class ChallengeDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int TargetValue { get; set; }
    public string? TargetRole { get; set; }
    public string? AchievementTitle { get; set; }
    public string? AchievementIconKey { get; set; }
    public string? AchievementColorKey { get; set; }
}

public class UserChallengeProgressDto
{
    public ChallengeDto Challenge { get; set; } = null!;
    public int CurrentValue { get; set; }
    public int TargetValue { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? CompletedAt { get; set; }
    public double ProgressPercent { get; set; }
}

public class MyChallengesResponse
{
    public List<UserChallengeProgressDto> Challenges { get; set; } = new();
    public int CompletedCount { get; set; }
    public int TotalCount { get; set; }
}
