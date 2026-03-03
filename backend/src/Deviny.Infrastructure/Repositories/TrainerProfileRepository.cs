using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Repositories;

public class TrainerProfileRepository : ITrainerProfileRepository
{
    private readonly ApplicationDbContext _context;

    public TrainerProfileRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TrainerProfile?> GetByUserIdAsync(Guid userId)
    {
        return await _context.TrainerProfiles
            .FirstOrDefaultAsync(tp => tp.UserId == userId);
    }

    public async Task<TrainerProfile?> GetByUserIdWithDetailsAsync(Guid userId)
    {
        return await _context.TrainerProfiles
            .Include(tp => tp.Certificates.OrderBy(c => c.SortOrder))
            .Include(tp => tp.Specializations)
                .ThenInclude(ts => ts.Specialization)
            .FirstOrDefaultAsync(tp => tp.UserId == userId);
    }

    public async Task<List<TrainerProfile>> GetAllWithDetailsAsync()
    {
        return await _context.TrainerProfiles
            .AsNoTracking()
            .Include(tp => tp.User)
            .Include(tp => tp.Specializations)
                .ThenInclude(ts => ts.Specialization)
            .OrderByDescending(tp => tp.CreatedAt)
            .ToListAsync();
    }

    public async Task<(List<TrainerProfile> Items, int TotalCount)> GetAllWithDetailsPagedAsync(int page, int pageSize)
    {
        var query = _context.TrainerProfiles.AsNoTracking();

        var totalCount = await query.CountAsync();

        var items = await query
            .Include(tp => tp.User)
            .Include(tp => tp.Specializations)
                .ThenInclude(ts => ts.Specialization)
            .OrderByDescending(tp => tp.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<TrainerProfile> CreateAsync(TrainerProfile profile)
    {
        _context.TrainerProfiles.Add(profile);
        await _context.SaveChangesAsync();
        return profile;
    }

    public async Task<TrainerProfile> UpdateAsync(TrainerProfile profile)
    {
        profile.UpdatedAt = DateTime.UtcNow;
        _context.TrainerProfiles.Update(profile);
        await _context.SaveChangesAsync();
        return profile;
    }

    public async Task<bool> IsSlugUniqueAsync(string slug, Guid? excludeUserId = null)
    {
        var query = _context.TrainerProfiles.Where(tp => tp.Slug == slug);
        
        if (excludeUserId.HasValue)
        {
            query = query.Where(tp => tp.UserId != excludeUserId.Value);
        }
        
        return !await query.AnyAsync();
    }
}
