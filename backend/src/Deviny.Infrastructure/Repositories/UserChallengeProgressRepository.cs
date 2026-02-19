using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Repositories;

public class UserChallengeProgressRepository : IUserChallengeProgressRepository
{
    private readonly ApplicationDbContext _context;

    public UserChallengeProgressRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserChallengeProgress>> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context.UserChallengeProgress
            .AsNoTracking()
            .Include(p => p.Challenge)
                .ThenInclude(c => c.Achievement)
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync(ct);
    }

    public async Task<UserChallengeProgress?> GetAsync(Guid userId, Guid challengeId, CancellationToken ct = default)
    {
        return await _context.UserChallengeProgress
            .FirstOrDefaultAsync(p => p.UserId == userId && p.ChallengeId == challengeId, ct);
    }

    public async Task<UserChallengeProgress> GetOrCreateAsync(Guid userId, Guid challengeId, CancellationToken ct = default)
    {
        var existing = await GetAsync(userId, challengeId, ct);
        if (existing != null) return existing;

        var now = DateTime.UtcNow;
        var progress = new UserChallengeProgress
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ChallengeId = challengeId,
            CurrentValue = 0,
            Status = ChallengeStatus.Active,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.UserChallengeProgress.Add(progress);
        await _context.SaveChangesAsync(ct);
        return progress;
    }

    public async Task UpdateAsync(UserChallengeProgress entity, CancellationToken ct = default)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        _context.UserChallengeProgress.Update(entity);
        await _context.SaveChangesAsync(ct);
    }
}
