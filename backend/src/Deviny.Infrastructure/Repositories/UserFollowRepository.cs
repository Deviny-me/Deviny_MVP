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

    public async Task<bool> AreMutualFollowsAsync(Guid userId1, Guid userId2)
    {
        return await _context.UserFollows.AnyAsync(uf => uf.FollowerId == userId1 && uf.TrainerId == userId2)
            && await _context.UserFollows.AnyAsync(uf => uf.FollowerId == userId2 && uf.TrainerId == userId1);
    }

    public async Task<DateTime?> GetMutualFollowSinceAsync(Guid userId1, Guid userId2)
    {
        var followForward = await _context.UserFollows
            .AsNoTracking()
            .Where(uf => uf.FollowerId == userId1 && uf.TrainerId == userId2)
            .Select(uf => (DateTime?)uf.CreatedAt)
            .FirstOrDefaultAsync();

        var followReverse = await _context.UserFollows
            .AsNoTracking()
            .Where(uf => uf.FollowerId == userId2 && uf.TrainerId == userId1)
            .Select(uf => (DateTime?)uf.CreatedAt)
            .FirstOrDefaultAsync();

        if (followForward == null || followReverse == null)
        {
            return null;
        }

        return followForward > followReverse ? followForward : followReverse;
    }

    public async Task<(List<(User Friend, DateTime FriendsSince)> Items, int TotalCount)> GetMutualFriendsPagedAsync(Guid userId, int page, int pageSize)
    {
        var mutualQuery =
            from outgoing in _context.UserFollows.AsNoTracking()
            join incoming in _context.UserFollows.AsNoTracking()
                on new { A = outgoing.TrainerId, B = outgoing.FollowerId }
                equals new { A = incoming.FollowerId, B = incoming.TrainerId }
            where outgoing.FollowerId == userId
            select new
            {
                FriendId = outgoing.TrainerId,
                FriendsSince = outgoing.CreatedAt >= incoming.CreatedAt ? outgoing.CreatedAt : incoming.CreatedAt
            };

        var totalCount = await mutualQuery.CountAsync();

        var pairs = await mutualQuery
            .OrderByDescending(x => x.FriendsSince)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var friendIds = pairs.Select(x => x.FriendId).ToList();
        var users = await _context.Users
            .AsNoTracking()
            .Where(u => friendIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id);

        var items = pairs
            .Where(p => users.ContainsKey(p.FriendId))
            .Select(p => (users[p.FriendId], p.FriendsSince))
            .ToList();

        return (items, totalCount);
    }

    public async Task DeleteMutualFollowPairAsync(Guid userId1, Guid userId2)
    {
        var pair = await _context.UserFollows
            .Where(uf =>
                (uf.FollowerId == userId1 && uf.TrainerId == userId2) ||
                (uf.FollowerId == userId2 && uf.TrainerId == userId1))
            .ToListAsync();

        if (pair.Count == 0)
        {
            return;
        }

        _context.UserFollows.RemoveRange(pair);
        await _context.SaveChangesAsync();
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
