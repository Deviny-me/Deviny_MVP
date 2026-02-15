using Deviny.Domain.Enums;

namespace Deviny.Application.Common.Interfaces;

public interface IAchievementService
{
    /// <summary>
    /// Attempts to award an achievement to a user. Idempotent — skips if already awarded.
    /// Also checks TargetRole compatibility and updates related challenge progress.
    /// </summary>
    Task<AwardResult> TryAwardAchievementAsync(
        Guid userId,
        string achievementCode,
        AchievementSourceType sourceType,
        Guid? sourceId = null,
        CancellationToken ct = default);
}

public record AwardResult
{
    public bool Awarded { get; init; }
    public AchievementAwardedDto? Achievement { get; init; }
}

public record AchievementAwardedDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string IconKey { get; init; } = string.Empty;
    public string ColorKey { get; init; } = string.Empty;
    public string Rarity { get; init; } = string.Empty;
    public int XpReward { get; init; }
}
