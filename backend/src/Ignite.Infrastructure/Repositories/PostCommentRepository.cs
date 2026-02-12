using Ignite.Application.Common.Interfaces;
using Ignite.Domain.Entities;
using Ignite.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ignite.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for PostComment entity.
/// Uses EF Core for data access.
/// </summary>
public class PostCommentRepository : IPostCommentRepository
{
    private readonly ApplicationDbContext _context;

    public PostCommentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PostComment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Set<PostComment>()
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<PostComment> CreateAsync(PostComment comment, CancellationToken cancellationToken = default)
    {
        await _context.Set<PostComment>().AddAsync(comment, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return comment;
    }

    public async Task<bool> SoftDeleteAsync(Guid commentId, CancellationToken cancellationToken = default)
    {
        var comment = await _context.Set<PostComment>()
            .FirstOrDefaultAsync(c => c.Id == commentId, cancellationToken);

        if (comment == null)
            return false;

        comment.IsDeleted = true;
        comment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<List<PostComment>> GetByPostIdPagedAsync(
        Guid postId, 
        int page, 
        int pageSize, 
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<PostComment>()
            .AsNoTracking()
            .Include(c => c.User)
            .Where(c => c.PostId == postId && !c.IsDeleted)
            .OrderBy(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetCountByPostIdAsync(Guid postId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<PostComment>()
            .CountAsync(c => c.PostId == postId && !c.IsDeleted, cancellationToken);
    }

    public async Task<Dictionary<Guid, int>> GetCountsForPostsAsync(
        IEnumerable<Guid> postIds, 
        CancellationToken cancellationToken = default)
    {
        var postIdList = postIds.ToList();
        
        var counts = await _context.Set<PostComment>()
            .Where(c => postIdList.Contains(c.PostId) && !c.IsDeleted)
            .GroupBy(c => c.PostId)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);
        
        return counts.ToDictionary(x => x.PostId, x => x.Count);
    }
}
