using Ignite.Application.Features.Levels.DTOs;
using Ignite.Domain.Enums;

namespace Ignite.Application.Common.Interfaces;

public interface ILevelService
{
    Task<AddXpResult> AddXpAsync(Guid userId, XpEventType eventType, int xpAmount, string idempotencyKey, Guid? sourceEntityId = null);
    Task<UserLevelDto> GetUserLevelAsync(Guid userId);
    Task EnsureUserLevelExistsAsync(Guid userId);
}
