using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for PostLike entity.
/// Uses EF Core for data access.
/// </summary>
public class PostLikeRepository : IPostLikeRepository
{
    private readonly ApplicationDbContext _context;

    public PostLikeRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PostLike> AddAsync(PostLike like, CancellationToken cancellationToken = default)
    {
        await _context.Set<PostLike>().AddAsync(like, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return like;
    }

    public async Task<bool> RemoveAsync(Guid postId, Guid userId, CancellationToken cancellationToken = default)
    {
        var like = await _context.Set<PostLike>()
            .FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId, cancellationToken);

        if (like == null)
            return false;

        _context.Set<PostLike>().Remove(like);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(Guid postId, Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<PostLike>()
            .AnyAsync(l => l.PostId == postId && l.UserId == userId, cancellationToken);
    }

    public async Task<int> GetCountAsync(Guid postId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<PostLike>()
            .CountAsync(l => l.PostId == postId, cancellationToken);
    }

    public async Task<List<PostLike>> GetLikersPagedAsync(
        Guid postId, 
        int page, 
        int pageSize, 
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<PostLike>()
            .AsNoTracking()
            .Include(l => l.User)
            .Where(l => l.PostId == postId)
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<HashSet<Guid>> GetLikedPostIdsAsync(
        IEnumerable<Guid> postIds, 
        Guid userId, 
        CancellationToken cancellationToken = default)
    {
        var postIdList = postIds.ToList();
        
        var likedIds = await _context.Set<PostLike>()
            .Where(l => postIdList.Contains(l.PostId) && l.UserId == userId)
            .Select(l => l.PostId)
            .ToListAsync(cancellationToken);
        
        return likedIds.ToHashSet();
    }
    
    public async Task<Dictionary<Guid, int>> GetLikeCountsForPostsAsync(
        IEnumerable<Guid> postIds, 
        CancellationToken cancellationToken = default)
    {
        var postIdList = postIds.ToList();
        
        var counts = await _context.Set<PostLike>()
            .Where(l => postIdList.Contains(l.PostId))
            .GroupBy(l => l.PostId)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);
        
        return counts.ToDictionary(x => x.PostId, x => x.Count);
    }
}
