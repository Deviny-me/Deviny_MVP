using Deviny.Application.Features.Levels.DTOs;

namespace Deviny.Application.Common.Interfaces;

/// <summary>
/// Pushes real-time XP/level updates to the user via SignalR.
/// Implemented by the API layer.
/// </summary>
public interface ILevelNotifier
{
    Task NotifyXpUpdatedAsync(Guid userId, AddXpResult result, CancellationToken ct = default);
}
