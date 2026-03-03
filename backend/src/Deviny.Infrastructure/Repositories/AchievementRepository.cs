using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Repositories;

public class AchievementRepository : IAchievementRepository
{
    private readonly ApplicationDbContext _context;

    public AchievementRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Achievement?> GetByCodeAsync(string code, CancellationToken ct = default)
    {
        return await _context.Achievements
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Code == code, ct);
    }

    public async Task<Achievement?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Achievements.FindAsync(new object[] { id }, ct);
    }

    public async Task<List<Achievement>> GetAllActiveAsync(CancellationToken ct = default)
    {
        return await _context.Achievements
            .AsNoTracking()
            .Where(a => a.IsActive)
            .OrderBy(a => a.CreatedAt)
            .ToListAsync(ct);
    }
}
