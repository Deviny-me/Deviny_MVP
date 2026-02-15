using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Repositories;

public class UserAchievementRepository : IUserAchievementRepository
{
    private readonly ApplicationDbContext _context;

    public UserAchievementRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> ExistsAsync(Guid userId, Guid achievementId, CancellationToken ct = default)
    {
        return await _context.UserAchievements
            .AnyAsync(ua => ua.UserId == userId && ua.AchievementId == achievementId, ct);
    }

    public async Task<List<UserAchievement>> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context.UserAchievements
            .AsNoTracking()
            .Include(ua => ua.Achievement)
            .Where(ua => ua.UserId == userId)
            .OrderByDescending(ua => ua.AwardedAt)
            .ToListAsync(ct);
    }

    public async Task AddAsync(UserAchievement entity, CancellationToken ct = default)
    {
        _context.UserAchievements.Add(entity);
        await _context.SaveChangesAsync(ct);
    }
}
