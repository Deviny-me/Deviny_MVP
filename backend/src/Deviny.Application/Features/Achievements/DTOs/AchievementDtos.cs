using Deviny.Domain.Enums;

namespace Deviny.Application.Features.Achievements.DTOs;

public class AchievementDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string IconKey { get; set; } = string.Empty;
    public string ColorKey { get; set; } = string.Empty;
    public string Rarity { get; set; } = string.Empty;
    public int XpReward { get; set; }
    public string? TargetRole { get; set; }
    public bool IsUnlocked { get; set; }
    public DateTime? AwardedAt { get; set; }
}

public class UserAchievementDto
{
    public Guid Id { get; set; }
    public AchievementDto Achievement { get; set; } = null!;
    public DateTime AwardedAt { get; set; }
    public string SourceType { get; set; } = string.Empty;
    public Guid? SourceId { get; set; }
}

public class MyAchievementsResponse
{
    public List<AchievementDto> All { get; set; } = new();
    public int UnlockedCount { get; set; }
    public int TotalCount { get; set; }
}
