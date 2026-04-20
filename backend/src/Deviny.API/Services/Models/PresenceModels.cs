namespace Deviny.API.Services.Models;

public sealed record PresenceStateDto(Guid UserId, bool IsOnline, DateTime? LastSeenAtUtc);

public sealed record PresenceChangeResult(bool Changed, PresenceStateDto State);
