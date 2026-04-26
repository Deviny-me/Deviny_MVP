using Deviny.API.Services.Models;

namespace Deviny.API.Services;

public interface IPresenceService
{
    Task<PresenceStateDto> GetUserPresenceAsync(Guid userId, CancellationToken ct = default);
    Task<PresenceChangeResult> OnConnectedAsync(Guid userId, string connectionId, CancellationToken ct = default);
    Task<PresenceChangeResult> OnDisconnectedAsync(Guid userId, string connectionId, CancellationToken ct = default);
    Task<PresenceChangeResult> HeartbeatAsync(Guid userId, string connectionId, CancellationToken ct = default);
    Task MarkOfflineAsync(Guid userId, DateTime? lastSeenAtUtc = null, CancellationToken ct = default);
    Task<IReadOnlyList<PresenceStateDto>> SweepStaleUsersAsync(CancellationToken ct = default);
}
