using Ignite.Application.Common.Interfaces;
using Ignite.Domain.Entities;
using Ignite.Domain.Enums;
using Ignite.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ignite.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for UserPost entity.
/// Uses EF Core for data access.
/// </summary>
public class UserPostRepository : IUserPostRepository
{
    private readonly ApplicationDbContext _context;

    public UserPostRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserPost?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Set<UserPost>()
            .AsSplitQuery()
            .Include(p => p.Media.OrderBy(m => m.DisplayOrder))
            .Include(p => p.User)
            .Include(p => p.OriginalPost)
                .ThenInclude(op => op!.Media.OrderBy(m => m.DisplayOrder))
            .Include(p => p.OriginalPost)
                .ThenInclude(op => op!.User)
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, cancellationToken);
    }

    public async Task<UserPost?> GetByIdForUserAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<UserPost>()
            .Include(p => p.Media.OrderBy(m => m.DisplayOrder))
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId && !p.IsDeleted, cancellationToken);
    }
    
    public async Task<UserPost?> GetByIdForDeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        // Get post for deletion - allow already soft-deleted posts (e.g., reposts of deleted original)
        return await _context.Set<UserPost>()
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId, cancellationToken);
    }

    public async Task<List<UserPost>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<UserPost>()
            .AsNoTracking()
            .AsSplitQuery()
            .Include(p => p.Media.OrderBy(m => m.DisplayOrder))
            .Include(p => p.User)
            .Include(p => p.OriginalPost)
                .ThenInclude(op => op!.Media.OrderBy(m => m.DisplayOrder))
            .Include(p => p.OriginalPost)
                .ThenInclude(op => op!.User)
            .Where(p => p.UserId == userId && !p.IsDeleted)
            // Hide reposts where the original post was deleted
            .Where(p => p.OriginalPostId == null || !p.OriginalPost!.IsDeleted)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<UserPost>> GetByUserIdPagedAsync(
        Guid userId, 
        int page, 
        int pageSize, 
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<UserPost>()
            .AsNoTracking()
            .AsSplitQuery()
            .Include(p => p.Media.OrderBy(m => m.DisplayOrder))
            .Include(p => p.User)
            .Include(p => p.OriginalPost)
                .ThenInclude(op => op!.Media.OrderBy(m => m.DisplayOrder))
            .Include(p => p.OriginalPost)
                .ThenInclude(op => op!.User)
            .Where(p => p.UserId == userId && !p.IsDeleted)
            // Hide reposts where the original post was deleted
            .Where(p => p.OriginalPostId == null || !p.OriginalPost!.IsDeleted)
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetCountByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<UserPost>()
            .Where(p => p.UserId == userId && !p.IsDeleted)
            // Hide reposts where the original post was deleted
            .Where(p => p.OriginalPostId == null || !p.OriginalPost!.IsDeleted)
            .CountAsync(cancellationToken);
    }

    public async Task<UserPost> CreateAsync(UserPost post, CancellationToken cancellationToken = default)
    {
        await _context.Set<UserPost>().AddAsync(post, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return post;
    }

    public async Task<UserPost> UpdateAsync(UserPost post, CancellationToken cancellationToken = default)
    {
        post.UpdatedAt = DateTime.UtcNow;
        _context.Set<UserPost>().Update(post);
        await _context.SaveChangesAsync(cancellationToken);
        return post;
    }

    public async Task DeleteAsync(UserPost post, CancellationToken cancellationToken = default)
    {
        _context.Set<UserPost>().Remove(post);
        await _context.SaveChangesAsync(cancellationToken);
    }
    
    public async Task SoftDeleteAsync(UserPost post, CancellationToken cancellationToken = default)
    {
        // Use direct SQL for faster execution (avoids updating all columns)
        await _context.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE UserPosts SET IsDeleted = 1, UpdatedAt = {DateTime.UtcNow} WHERE Id = {post.Id}",
            cancellationToken);
    }
    
    public async Task SoftDeleteRepostsOfPostAsync(Guid originalPostId, CancellationToken cancellationToken = default)
    {
        // Soft delete all reposts of this post
        await _context.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE UserPosts SET IsDeleted = 1, UpdatedAt = {DateTime.UtcNow} WHERE OriginalPostId = {originalPostId} AND IsDeleted = 0",
            cancellationToken);
    }
    
    public async Task<List<UserPost>> GetFeedPagedAsync(
        int page, 
        int pageSize, 
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<UserPost>()
            .AsNoTracking()
            .AsSplitQuery()
            .Include(p => p.Media.OrderBy(m => m.DisplayOrder))
            .Include(p => p.User)
            .Include(p => p.OriginalPost)
                .ThenInclude(op => op!.Media.OrderBy(m => m.DisplayOrder))
            .Include(p => p.OriginalPost)
                .ThenInclude(op => op!.User)
            .Where(p => !p.IsDeleted && p.Visibility == PostVisibility.Public)
            // Hide reposts where the original post was deleted
            .Where(p => p.OriginalPostId == null || !p.OriginalPost!.IsDeleted)
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }
    
    public async Task<int> GetFeedCountAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Set<UserPost>()
            .Where(p => !p.IsDeleted && p.Visibility == PostVisibility.Public)
            // Hide reposts where the original post was deleted
            .Where(p => p.OriginalPostId == null || !p.OriginalPost!.IsDeleted)
            .CountAsync(cancellationToken);
    }
    
    public async Task<int> GetRepostCountAsync(Guid postId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<UserPost>()
            .CountAsync(p => p.OriginalPostId == postId && !p.IsDeleted, cancellationToken);
    }
    
    public async Task<Dictionary<Guid, int>> GetRepostCountsForPostsAsync(
        IEnumerable<Guid> postIds, 
        CancellationToken cancellationToken = default)
    {
        var postIdList = postIds.ToList();
        
        var counts = await _context.Set<UserPost>()
            .Where(p => p.OriginalPostId != null && postIdList.Contains(p.OriginalPostId.Value) && !p.IsDeleted)
            .GroupBy(p => p.OriginalPostId!.Value)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);
        
        return counts.ToDictionary(x => x.PostId, x => x.Count);
    }
    
    public async Task<bool> HasUserRepostedAsync(Guid postId, Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<UserPost>()
            .AnyAsync(p => p.OriginalPostId == postId && p.UserId == userId && !p.IsDeleted, cancellationToken);
    }
    
    public async Task<UserPost?> GetUserRepostAsync(Guid originalPostId, Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<UserPost>()
            .FirstOrDefaultAsync(p => p.OriginalPostId == originalPostId && p.UserId == userId && !p.IsDeleted, cancellationToken);
    }
}
