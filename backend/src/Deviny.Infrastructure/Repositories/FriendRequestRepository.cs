using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Repositories;

public class FriendRequestRepository : IFriendRequestRepository
{
    private readonly ApplicationDbContext _context;

    public FriendRequestRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<FriendRequest?> GetByIdAsync(int id)
    {
        return await _context.FriendRequests
            .Include(fr => fr.Sender)
            .Include(fr => fr.Receiver)
            .FirstOrDefaultAsync(fr => fr.Id == id);
    }

    public async Task<FriendRequest?> GetActiveRequestBetweenUsersAsync(Guid userId1, Guid userId2)
    {
        return await _context.FriendRequests
            .AsNoTracking()
            .Include(fr => fr.Sender)
            .Include(fr => fr.Receiver)
            .FirstOrDefaultAsync(fr =>
                fr.Status == FriendRequestStatus.Pending &&
                ((fr.SenderId == userId1 && fr.ReceiverId == userId2) ||
                 (fr.SenderId == userId2 && fr.ReceiverId == userId1)));
    }

    public async Task<FriendRequest?> GetAcceptedRequestBetweenUsersAsync(Guid userId1, Guid userId2)
    {
        return await _context.FriendRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(fr =>
                fr.Status == FriendRequestStatus.Accepted &&
                ((fr.SenderId == userId1 && fr.ReceiverId == userId2) ||
                 (fr.SenderId == userId2 && fr.ReceiverId == userId1)));
    }

    public async Task<bool> AreFriendsAsync(Guid userId1, Guid userId2)
    {
        var acceptedFriendRequest = await _context.FriendRequests
            .AnyAsync(fr =>
                fr.Status == FriendRequestStatus.Accepted &&
                ((fr.SenderId == userId1 && fr.ReceiverId == userId2) ||
                 (fr.SenderId == userId2 && fr.ReceiverId == userId1)));

        if (acceptedFriendRequest)
        {
            return true;
        }

        var user1FollowsUser2 = await _context.UserFollows
            .AnyAsync(uf => uf.FollowerId == userId1 && uf.TrainerId == userId2);
        if (!user1FollowsUser2)
        {
            return false;
        }

        return await _context.UserFollows
            .AnyAsync(uf => uf.FollowerId == userId2 && uf.TrainerId == userId1);
    }

    public async Task<List<FriendRequest>> GetIncomingRequestsAsync(Guid userId)
    {
        return await _context.FriendRequests
            .AsNoTracking()
            .Include(fr => fr.Sender)
            .Include(fr => fr.Receiver)
            .Where(fr => fr.ReceiverId == userId && fr.Status == FriendRequestStatus.Pending)
            .OrderByDescending(fr => fr.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<FriendRequest>> GetOutgoingRequestsAsync(Guid userId)
    {
        return await _context.FriendRequests
            .AsNoTracking()
            .Include(fr => fr.Sender)
            .Include(fr => fr.Receiver)
            .Where(fr => fr.SenderId == userId && fr.Status == FriendRequestStatus.Pending)
            .OrderByDescending(fr => fr.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<(User Friend, DateTime FriendsSince)>> GetFriendsAsync(Guid userId)
    {
        var acceptedFriendRequests = await _context.FriendRequests
            .AsNoTracking()
            .Include(fr => fr.Sender)
            .Include(fr => fr.Receiver)
            .Where(fr =>
                fr.Status == FriendRequestStatus.Accepted &&
                (fr.SenderId == userId || fr.ReceiverId == userId))
            .ToListAsync();

        var acceptedFriends = acceptedFriendRequests
            .Select(fr => (
                Friend: fr.SenderId == userId ? fr.Receiver : fr.Sender,
                FriendsSince: fr.RespondedAt ?? fr.CreatedAt
            ))
            .ToList();

        var mutualFollows = await (
            from outgoing in _context.UserFollows.AsNoTracking()
            join incoming in _context.UserFollows.AsNoTracking()
                on new { A = outgoing.TrainerId, B = outgoing.FollowerId }
                equals new { A = incoming.FollowerId, B = incoming.TrainerId }
            join u in _context.Users.AsNoTracking() on outgoing.TrainerId equals u.Id
            where outgoing.FollowerId == userId
            select new
            {
                Friend = u,
                FriendsSince = outgoing.CreatedAt >= incoming.CreatedAt ? outgoing.CreatedAt : incoming.CreatedAt
            })
            .ToListAsync();

        var combined = acceptedFriends
            .Concat(mutualFollows.Select(x => (x.Friend, x.FriendsSince)))
            .GroupBy(x => x.Friend.Id)
            .Select(g => g.OrderByDescending(x => x.FriendsSince).First())
            .OrderByDescending(x => x.FriendsSince)
            .ToList();

        return combined;
    }

    public async Task<(List<(User Friend, DateTime FriendsSince)> Items, int TotalCount)> GetFriendsPagedAsync(Guid userId, int page, int pageSize)
    {
        var acceptedFriendsQuery = _context.FriendRequests
            .AsNoTracking()
            .Where(fr =>
                fr.Status == FriendRequestStatus.Accepted &&
                (fr.SenderId == userId || fr.ReceiverId == userId));

        var acceptedFriendRequests = await acceptedFriendsQuery
            .Include(fr => fr.Sender)
            .Include(fr => fr.Receiver)
            .OrderByDescending(fr => fr.RespondedAt ?? fr.CreatedAt)
            .ToListAsync();

        var acceptedFriends = acceptedFriendRequests
            .Select(fr => (
                Friend: fr.SenderId == userId ? fr.Receiver : fr.Sender,
                FriendsSince: fr.RespondedAt ?? fr.CreatedAt
            ))
            .ToList();

        var mutualFollows = await (
            from outgoing in _context.UserFollows.AsNoTracking()
            join incoming in _context.UserFollows.AsNoTracking()
                on new { A = outgoing.TrainerId, B = outgoing.FollowerId }
                equals new { A = incoming.FollowerId, B = incoming.TrainerId }
            join u in _context.Users.AsNoTracking() on outgoing.TrainerId equals u.Id
            where outgoing.FollowerId == userId
            select new
            {
                Friend = u,
                FriendsSince = outgoing.CreatedAt >= incoming.CreatedAt ? outgoing.CreatedAt : incoming.CreatedAt
            })
            .ToListAsync();

        var combined = acceptedFriends
            .Concat(mutualFollows.Select(x => (x.Friend, x.FriendsSince)))
            .GroupBy(x => x.Friend.Id)
            .Select(g => g.OrderByDescending(x => x.FriendsSince).First())
            .OrderByDescending(x => x.FriendsSince)
            .ToList();

        var totalCount = combined.Count;
        var paged = combined
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return (paged, totalCount);
    }

    public async Task AddAsync(FriendRequest friendRequest)
    {
        await _context.FriendRequests.AddAsync(friendRequest);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(FriendRequest friendRequest)
    {
        _context.FriendRequests.Update(friendRequest);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(FriendRequest friendRequest)
    {
        _context.FriendRequests.Remove(friendRequest);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteFriendshipAsync(Guid userId1, Guid userId2)
    {
        var acceptedFriendRequest = await _context.FriendRequests
            .FirstOrDefaultAsync(fr =>
                fr.Status == FriendRequestStatus.Accepted &&
                ((fr.SenderId == userId1 && fr.ReceiverId == userId2) ||
                 (fr.SenderId == userId2 && fr.ReceiverId == userId1)));

        if (acceptedFriendRequest != null)
        {
            _context.FriendRequests.Remove(acceptedFriendRequest);
        }

        var mutualFollows = await _context.UserFollows
            .Where(uf =>
                (uf.FollowerId == userId1 && uf.TrainerId == userId2) ||
                (uf.FollowerId == userId2 && uf.TrainerId == userId1))
            .ToListAsync();

        if (mutualFollows.Count > 0)
        {
            _context.UserFollows.RemoveRange(mutualFollows);
        }

        if (acceptedFriendRequest != null || mutualFollows.Count > 0)
        {
            await _context.SaveChangesAsync();
        }
    }
}
