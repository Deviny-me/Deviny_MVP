using Deviny.Application.Features.Levels.DTOs;
using Deviny.Domain.Enums;

namespace Deviny.Application.Common.Interfaces;

public interface ILevelService
{
    Task<AddXpResult> AddXpAsync(Guid userId, XpEventType eventType, int xpAmount, string idempotencyKey, Guid? sourceEntityId = null);
    Task NotifyXpChangeAsync(Guid userId, AddXpResult result, CancellationToken ct = default);
    Task<UserLevelDto> GetUserLevelAsync(Guid userId);
    Task EnsureUserLevelExistsAsync(Guid userId);
}
