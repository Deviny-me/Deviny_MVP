using Deviny.API.Hubs;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Levels.DTOs;
using Microsoft.AspNetCore.SignalR;

namespace Deviny.API.Services;

/// <summary>
/// Pushes XP/level updates to connected users via SignalR.
/// Sends to the user's personal group (user:{id}).
/// </summary>
public class SignalRLevelNotifier : ILevelNotifier
{
    private readonly IHubContext<ChatHub> _hubContext;

    public SignalRLevelNotifier(IHubContext<ChatHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyXpUpdatedAsync(
        Guid userId,
        AddXpResult result,
        CancellationToken ct = default)
    {
        var group = $"user:{userId.ToString().ToLowerInvariant()}";
        await _hubContext.Clients.Group(group).SendAsync("XpUpdated", new
        {
            xpAdded = result.XpAdded,
            leveledUp = result.LeveledUp,
            newLevel = result.NewLevel,
            currentState = result.CurrentState
        }, ct);
    }
}
