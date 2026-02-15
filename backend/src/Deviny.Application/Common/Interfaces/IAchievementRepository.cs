using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

public interface IAchievementRepository
{
    Task<Achievement?> GetByCodeAsync(string code, CancellationToken ct = default);
    Task<Achievement?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<Achievement>> GetAllActiveAsync(CancellationToken ct = default);
}
