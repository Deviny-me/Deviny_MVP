using Ignite.Application.Common.Interfaces;
using Ignite.Domain.Entities;
using Ignite.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ignite.Infrastructure.Repositories;

public class UserFollowRepository : IUserFollowRepository
{
    private readonly ApplicationDbContext _context;

    public UserFollowRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserFollow?> GetFollowAsync(Guid followerId, Guid trainerId)
    {
        return await _context.UserFollows
            .FirstOrDefaultAsync(uf => uf.FollowerId == followerId && uf.TrainerId == trainerId);
    }

    public async Task<List<(User Trainer, DateTime FollowedAt)>> GetFollowingAsync(Guid userId)
    {
        return await _context.UserFollows
            .AsNoTracking()
            .Include(uf => uf.Trainer)
            .Where(uf => uf.FollowerId == userId)
            .OrderByDescending(uf => uf.CreatedAt)
            .Select(uf => new ValueTuple<User, DateTime>(uf.Trainer, uf.CreatedAt))
            .ToListAsync();
    }

    public async Task<int> GetFollowerCountAsync(Guid trainerId)
    {
        return await _context.UserFollows
            .CountAsync(uf => uf.TrainerId == trainerId);
    }

    public async Task AddAsync(UserFollow userFollow)
    {
        await _context.UserFollows.AddAsync(userFollow);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(UserFollow userFollow)
    {
        _context.UserFollows.Remove(userFollow);
        await _context.SaveChangesAsync();
    }
}
