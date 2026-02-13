using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Repositories;

public class UserBlockRepository : IUserBlockRepository
{
    private readonly ApplicationDbContext _context;

    public UserBlockRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserBlock?> GetBlockAsync(Guid blockerId, Guid blockedUserId)
    {
        return await _context.UserBlocks
            .FirstOrDefaultAsync(ub => ub.BlockerId == blockerId && ub.BlockedUserId == blockedUserId);
    }

    public async Task<bool> IsBlockedAsync(Guid userId1, Guid userId2)
    {
        return await _context.UserBlocks
            .AnyAsync(ub =>
                (ub.BlockerId == userId1 && ub.BlockedUserId == userId2) ||
                (ub.BlockerId == userId2 && ub.BlockedUserId == userId1));
    }

    public async Task AddAsync(UserBlock userBlock)
    {
        await _context.UserBlocks.AddAsync(userBlock);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(UserBlock userBlock)
    {
        _context.UserBlocks.Remove(userBlock);
        await _context.SaveChangesAsync();
    }
}
