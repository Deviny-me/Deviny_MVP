using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Repositories;

public class ChallengeRepository : IChallengeRepository
{
    private readonly ApplicationDbContext _context;

    public ChallengeRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Challenge>> GetAllActiveAsync(CancellationToken ct = default)
    {
        return await _context.Challenges
            .AsNoTracking()
            .Include(c => c.Achievement)
            .Where(c => c.IsActive)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<Challenge?> GetByCodeAsync(string code, CancellationToken ct = default)
    {
        return await _context.Challenges
            .AsNoTracking()
            .Include(c => c.Achievement)
            .FirstOrDefaultAsync(c => c.Code == code, ct);
    }

    public async Task<Challenge?> GetByAchievementIdAsync(Guid achievementId, CancellationToken ct = default)
    {
        return await _context.Challenges
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.AchievementId == achievementId, ct);
    }
}
