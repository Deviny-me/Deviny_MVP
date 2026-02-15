using Deviny.API.Hubs;
using Deviny.Application.Common.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace Deviny.API.Services;

/// <summary>
/// Pushes achievement notifications to connected users via SignalR.
/// Uses the user's personal group (user:{id}).
/// </summary>
public class SignalRAchievementNotifier : IAchievementNotifier
{
    private readonly IHubContext<ChatHub> _hubContext;

    public SignalRAchievementNotifier(IHubContext<ChatHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyAchievementAwardedAsync(
        Guid userId,
        AchievementAwardedDto achievement,
        CancellationToken ct = default)
    {
        var group = $"user:{userId.ToString().ToLowerInvariant()}";
        await _hubContext.Clients.Group(group).SendAsync("AchievementAwarded", achievement, ct);
    }
}
