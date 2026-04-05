using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Repositories;

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

    public async Task<(List<(User Trainer, DateTime FollowedAt)> Items, int TotalCount)> GetFollowingPagedAsync(Guid userId, int page, int pageSize)
    {
        var query = _context.UserFollows
            .AsNoTracking()
            .Where(uf => uf.FollowerId == userId);

        var totalCount = await query.CountAsync();

        var items = await query
            .Include(uf => uf.Trainer)
            .OrderByDescending(uf => uf.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(uf => new ValueTuple<User, DateTime>(uf.Trainer, uf.CreatedAt))
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<(List<(User Follower, DateTime FollowedAt)> Items, int TotalCount)> GetFollowersPagedAsync(Guid userId, int page, int pageSize)
    {
        var query = _context.UserFollows
            .AsNoTracking()
            .Where(uf => uf.TrainerId == userId);

        var totalCount = await query.CountAsync();

        var items = await query
            .Include(uf => uf.Follower)
            .OrderByDescending(uf => uf.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(uf => new ValueTuple<User, DateTime>(uf.Follower, uf.CreatedAt))
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<int> GetFollowingCountAsync(Guid userId)
    {
        return await _context.UserFollows
            .CountAsync(uf => uf.FollowerId == userId);
    }

    public async Task<int> GetFollowerCountAsync(Guid trainerId)
    {
        return await _context.UserFollows
            .CountAsync(uf => uf.TrainerId == trainerId);
    }

    public async Task<List<Guid>> GetFollowerIdsAsync(Guid trainerId, CancellationToken ct = default)
    {
        return await _context.UserFollows
            .AsNoTracking()
            .Where(uf => uf.TrainerId == trainerId)
            .Select(uf => uf.FollowerId)
            .ToListAsync(ct);
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
