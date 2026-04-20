using System.Collections.Concurrent;
using Deviny.API.Services.Models;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Deviny.API.Services;

public sealed class PresenceService : IPresenceService
{
    private static readonly TimeSpan HeartbeatTimeout = TimeSpan.FromSeconds(90);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PresenceService> _logger;
    private readonly ConcurrentDictionary<Guid, PresenceEntry> _entries = new();

    public PresenceService(IServiceScopeFactory scopeFactory, ILogger<PresenceService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task<PresenceStateDto> GetUserPresenceAsync(Guid userId, CancellationToken ct = default)
    {
        if (_entries.TryGetValue(userId, out var entry))
        {
            lock (entry.Sync)
            {
                if (entry.IsOnline && DateTime.UtcNow - entry.LastHeartbeatUtc <= HeartbeatTimeout)
                {
                    return new PresenceStateDto(userId, true, entry.LastSeenAtUtc);
                }
            }
        }

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var dbState = await db.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.IsOnline, u.LastSeenAtUtc })
            .FirstOrDefaultAsync(ct);

        if (dbState == null)
        {
            return new PresenceStateDto(userId, false, null);
        }

        return new PresenceStateDto(userId, dbState.IsOnline, dbState.LastSeenAtUtc);
    }

    public async Task<PresenceChangeResult> OnConnectedAsync(Guid userId, string connectionId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var entry = _entries.GetOrAdd(userId, _ => new PresenceEntry());
        var changed = false;

        lock (entry.Sync)
        {
            entry.ConnectionIds.Add(connectionId);
            entry.LastHeartbeatUtc = now;

            if (!entry.IsOnline)
            {
                entry.IsOnline = true;
                changed = true;
            }
        }

        if (changed)
        {
            await PersistOnlineAsync(userId, ct);
        }

        return new PresenceChangeResult(changed, new PresenceStateDto(userId, true, null));
    }

    public async Task<PresenceChangeResult> OnDisconnectedAsync(Guid userId, string connectionId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var entry = _entries.GetOrAdd(userId, _ => new PresenceEntry());
        var changed = false;

        lock (entry.Sync)
        {
            entry.ConnectionIds.Remove(connectionId);
            if (entry.ConnectionIds.Count == 0 && entry.IsOnline)
            {
                entry.IsOnline = false;
                entry.LastSeenAtUtc = now;
                entry.LastHeartbeatUtc = now;
                changed = true;
            }
        }

        if (changed)
        {
            await PersistOfflineAsync(userId, now, ct);
            return new PresenceChangeResult(true, new PresenceStateDto(userId, false, now));
        }

        return new PresenceChangeResult(false, new PresenceStateDto(userId, false, null));
    }

    public async Task<PresenceChangeResult> HeartbeatAsync(Guid userId, string connectionId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var entry = _entries.GetOrAdd(userId, _ => new PresenceEntry());
        var changed = false;

        lock (entry.Sync)
        {
            entry.ConnectionIds.Add(connectionId);
            entry.LastHeartbeatUtc = now;

            if (!entry.IsOnline)
            {
                entry.IsOnline = true;
                changed = true;
            }
        }

        if (changed)
        {
            await PersistOnlineAsync(userId, ct);
        }

        return new PresenceChangeResult(changed, new PresenceStateDto(userId, true, null));
    }

    public async Task MarkOfflineAsync(Guid userId, DateTime? lastSeenAtUtc = null, CancellationToken ct = default)
    {
        var at = lastSeenAtUtc ?? DateTime.UtcNow;
        if (_entries.TryGetValue(userId, out var entry))
        {
            lock (entry.Sync)
            {
                entry.ConnectionIds.Clear();
                entry.IsOnline = false;
                entry.LastHeartbeatUtc = at;
                entry.LastSeenAtUtc = at;
            }
        }

        await PersistOfflineAsync(userId, at, ct);
    }

    public async Task<IReadOnlyList<PresenceStateDto>> SweepStaleUsersAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var staleUsers = new List<PresenceStateDto>();

        foreach (var kv in _entries)
        {
            ct.ThrowIfCancellationRequested();

            var userId = kv.Key;
            var entry = kv.Value;
            DateTime? seenAt = null;
            var changed = false;

            lock (entry.Sync)
            {
                if (entry.IsOnline && now - entry.LastHeartbeatUtc > HeartbeatTimeout)
                {
                    entry.IsOnline = false;
                    entry.ConnectionIds.Clear();
                    entry.LastSeenAtUtc = entry.LastHeartbeatUtc;
                    seenAt = entry.LastSeenAtUtc;
                    changed = true;
                }
            }

            if (changed)
            {
                var effectiveSeenAt = seenAt ?? now;
                await PersistOfflineAsync(userId, effectiveSeenAt, ct);
                staleUsers.Add(new PresenceStateDto(userId, false, effectiveSeenAt));
            }
        }

        return staleUsers;
    }

    private async Task PersistOnlineAsync(Guid userId, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var affected = await db.Users
            .Where(u => u.Id == userId && !u.IsOnline)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(u => u.IsOnline, true)
                .SetProperty(u => u.UpdatedAt, DateTime.UtcNow), ct);

        if (affected > 0)
        {
            _logger.LogDebug("Presence online persisted for user {UserId}", userId);
        }
    }

    private async Task PersistOfflineAsync(Guid userId, DateTime lastSeenAtUtc, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var affected = await db.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(u => u.IsOnline, false)
                .SetProperty(u => u.LastSeenAtUtc, lastSeenAtUtc)
                .SetProperty(u => u.UpdatedAt, DateTime.UtcNow), ct);

        if (affected > 0)
        {
            _logger.LogDebug("Presence offline persisted for user {UserId} at {SeenAt}", userId, lastSeenAtUtc);
        }
    }

    private sealed class PresenceEntry
    {
        public object Sync { get; } = new();
        public HashSet<string> ConnectionIds { get; } = new(StringComparer.Ordinal);
        public DateTime LastHeartbeatUtc { get; set; } = DateTime.UtcNow;
        public DateTime? LastSeenAtUtc { get; set; }
        public bool IsOnline { get; set; }
    }
}
