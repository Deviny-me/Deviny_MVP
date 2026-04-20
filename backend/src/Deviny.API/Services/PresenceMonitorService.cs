using Deviny.API.Hubs;
using Deviny.API.Services.Models;
using Microsoft.AspNetCore.SignalR;

namespace Deviny.API.Services;

public sealed class PresenceMonitorService : BackgroundService
{
    private static readonly TimeSpan SweepInterval = TimeSpan.FromSeconds(15);

    private readonly IPresenceService _presenceService;
    private readonly IHubContext<ChatHub> _hubContext;
    private readonly ILogger<PresenceMonitorService> _logger;

    public PresenceMonitorService(
        IPresenceService presenceService,
        IHubContext<ChatHub> hubContext,
        ILogger<PresenceMonitorService> logger)
    {
        _presenceService = presenceService;
        _hubContext = hubContext;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(SweepInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await timer.WaitForNextTickAsync(stoppingToken);
                var stale = await _presenceService.SweepStaleUsersAsync(stoppingToken);

                foreach (var state in stale)
                {
                    await BroadcastPresenceAsync(state, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Presence monitor sweep failed");
            }
        }
    }

    private Task BroadcastPresenceAsync(PresenceStateDto state, CancellationToken ct)
    {
        return _hubContext.Clients.Group($"presence:{state.UserId.ToString().ToLowerInvariant()}")
            .SendAsync("PresenceUpdated", new
            {
                userId = state.UserId,
                isOnline = state.IsOnline,
                lastSeenAtUtc = state.LastSeenAtUtc
            }, ct);
    }
}
