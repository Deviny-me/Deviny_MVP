using Ignite.Application.Common.Interfaces;
using Ignite.Domain.Entities;
using Ignite.Domain.Enums;
using Ignite.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ignite.Infrastructure.Repositories;

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
            .Include(fr => fr.Sender)
            .Include(fr => fr.Receiver)
            .FirstOrDefaultAsync(fr =>
                fr.Status == FriendRequestStatus.Pending &&
                ((fr.SenderId == userId1 && fr.ReceiverId == userId2) ||
                 (fr.SenderId == userId2 && fr.ReceiverId == userId1)));
    }

    public async Task<bool> AreFriendsAsync(Guid userId1, Guid userId2)
    {
        return await _context.FriendRequests
            .AnyAsync(fr =>
                fr.Status == FriendRequestStatus.Accepted &&
                ((fr.SenderId == userId1 && fr.ReceiverId == userId2) ||
                 (fr.SenderId == userId2 && fr.ReceiverId == userId1)));
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
        var friendRequests = await _context.FriendRequests
            .AsNoTracking()
            .Include(fr => fr.Sender)
            .Include(fr => fr.Receiver)
            .Where(fr =>
                fr.Status == FriendRequestStatus.Accepted &&
                (fr.SenderId == userId || fr.ReceiverId == userId))
            .ToListAsync();

        var friends = friendRequests
            .Select(fr => (
                Friend: fr.SenderId == userId ? fr.Receiver : fr.Sender,
                FriendsSince: fr.RespondedAt ?? fr.CreatedAt
            ))
            .ToList();

        return friends;
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
        var friendRequest = await _context.FriendRequests
            .FirstOrDefaultAsync(fr =>
                fr.Status == FriendRequestStatus.Accepted &&
                ((fr.SenderId == userId1 && fr.ReceiverId == userId2) ||
                 (fr.SenderId == userId2 && fr.ReceiverId == userId1)));

        if (friendRequest != null)
        {
            _context.FriendRequests.Remove(friendRequest);
            await _context.SaveChangesAsync();
        }
    }
}
