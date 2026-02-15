namespace Deviny.Application.Common.Interfaces;

/// <summary>
/// Pushes real-time notifications to the user when an achievement is awarded.
/// Implemented by the API layer using SignalR.
/// </summary>
public interface IAchievementNotifier
{
    Task NotifyAchievementAwardedAsync(Guid userId, AchievementAwardedDto achievement, CancellationToken ct = default);
}
