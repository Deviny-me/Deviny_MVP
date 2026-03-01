using Deviny.Application.Features.Levels.DTOs;
using Deviny.Domain.Enums;

namespace Deviny.Application.Common.Interfaces;

public interface IUserRatingService
{
    Task<UserRatingDto> GetUserRatingAsync(Guid userId, UserRole role, CancellationToken ct = default);
}

