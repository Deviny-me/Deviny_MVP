using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Programs.DTOs;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Repositories;

public class ProgramRepository : IProgramRepository
{
    private readonly ApplicationDbContext _context;

    public ProgramRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TrainingProgram?> GetByIdAsync(Guid id)
    {
        return await _context.TrainingPrograms
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<TrainingProgram?> GetByIdPublicAsync(Guid id)
    {
        return await _context.TrainingPrograms
            .AsNoTracking()
            .Include(p => p.Trainer)
                .ThenInclude(u => u.TrainerProfile)
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
    }

    public async Task<TrainingProgram?> GetByCodeAsync(string code)
    {
        return await _context.TrainingPrograms
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Code == code);
    }

    public async Task<List<TrainingProgram>> GetByTrainerIdAsync(Guid trainerId)
    {
        return await _context.TrainingPrograms
            .AsNoTracking()
            .Where(p => p.TrainerId == trainerId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<TrainingProgram>> GetAllPublicAsync()
    {
        return await _context.TrainingPrograms
            .AsNoTracking()
            .Include(p => p.Trainer)
                .ThenInclude(u => u.TrainerProfile)
            .Where(p => !p.IsDeleted && p.IsPublic)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<ProgramWithStatsDto>> GetByTrainerIdWithStatsAsync(Guid trainerId)
    {
        return await _context.TrainingPrograms
            .AsNoTracking()
            .Where(p => p.TrainerId == trainerId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProgramWithStatsDto
            {
                Program = p,
                AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => (double)r.Rating) : 0,
                TotalReviews = p.Reviews.Count(),
                TotalPurchases = p.Purchases.Count(pu => pu.Status == ProgramPurchaseStatus.Active),
            })
            .ToListAsync();
    }

    public async Task<List<ProgramWithStatsDto>> GetAllPublicWithStatsAsync()
    {
        return await _context.TrainingPrograms
            .AsNoTracking()
            .Where(p => !p.IsDeleted && p.IsPublic)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProgramWithStatsDto
            {
                Program = p,
                TrainerFullName = p.Trainer.FirstName + " " + p.Trainer.LastName,
                TrainerAvatarUrl = p.Trainer.AvatarUrl,
                TrainerSlug = p.Trainer.TrainerProfile != null ? p.Trainer.TrainerProfile.Slug : "",
                TrainerRole = p.Trainer.Role.ToString(),
                AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => (double)r.Rating) : 0,
                TotalReviews = p.Reviews.Count(),
                TotalPurchases = p.Purchases.Count(pu => pu.Status == ProgramPurchaseStatus.Active),
                StandardSpotsUsed = p.Purchases.Count(pu => pu.Tier == ProgramTier.Standard && pu.Status == ProgramPurchaseStatus.Active),
                ProSpotsUsed = p.Purchases.Count(pu => pu.Tier == ProgramTier.Pro && pu.Status == ProgramPurchaseStatus.Active),
                LatestReviewComment = p.Reviews
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => r.Comment)
                    .FirstOrDefault(),
                LatestReviewRating = p.Reviews
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => (int?)r.Rating)
                    .FirstOrDefault(),
                LatestReviewUserName = p.Reviews
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => r.User.FirstName + " " + r.User.LastName)
                    .FirstOrDefault(),
                LatestReviewCreatedAt = p.Reviews
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => (DateTime?)r.CreatedAt)
                    .FirstOrDefault(),
            })
            .ToListAsync();
    }

    public async Task<(List<ProgramWithStatsDto> Items, int TotalCount)> GetAllPublicWithStatsPagedAsync(int page, int pageSize,
        decimal? minPrice = null, decimal? maxPrice = null, double? minRating = null, string? tier = null, int? minSales = null)
    {
        var query = _context.TrainingPrograms
            .AsNoTracking()
            .Where(p => !p.IsDeleted && p.IsPublic);

        // Price filters
        if (minPrice.HasValue)
            query = query.Where(p => p.Price >= minPrice.Value
                || (p.StandardPrice != null && p.StandardPrice >= minPrice.Value)
                || (p.ProPrice != null && p.ProPrice >= minPrice.Value));
        if (maxPrice.HasValue)
            query = query.Where(p => p.Price <= maxPrice.Value);

        // Tier filter
        if (!string.IsNullOrEmpty(tier))
        {
            if (tier.Equals("Standard", StringComparison.OrdinalIgnoreCase))
                query = query.Where(p => p.StandardPrice != null);
            else if (tier.Equals("Pro", StringComparison.OrdinalIgnoreCase))
                query = query.Where(p => p.ProPrice != null);
        }

        // Rating filter (DB-level)
        if (minRating.HasValue && minRating.Value > 0)
            query = query.Where(p => p.Reviews.Any() && p.Reviews.Average(r => (double)r.Rating) >= minRating.Value);

        // Sales filter (DB-level)
        if (minSales.HasValue && minSales.Value > 0)
            query = query.Where(p => p.Purchases.Count(pu => pu.Status == ProgramPurchaseStatus.Active) >= minSales.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProgramWithStatsDto
            {
                Program = p,
                TrainerFullName = p.Trainer.FirstName + " " + p.Trainer.LastName,
                TrainerAvatarUrl = p.Trainer.AvatarUrl,
                TrainerSlug = p.Trainer.TrainerProfile != null ? p.Trainer.TrainerProfile.Slug : "",
                TrainerRole = p.Trainer.Role.ToString(),
                AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => (double)r.Rating) : 0,
                TotalReviews = p.Reviews.Count(),
                TotalPurchases = p.Purchases.Count(pu => pu.Status == ProgramPurchaseStatus.Active),
                StandardSpotsUsed = p.Purchases.Count(pu => pu.Tier == ProgramTier.Standard && pu.Status == ProgramPurchaseStatus.Active),
                ProSpotsUsed = p.Purchases.Count(pu => pu.Tier == ProgramTier.Pro && pu.Status == ProgramPurchaseStatus.Active),
                LatestReviewComment = p.Reviews
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => r.Comment)
                    .FirstOrDefault(),
                LatestReviewRating = p.Reviews
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => (int?)r.Rating)
                    .FirstOrDefault(),
                LatestReviewUserName = p.Reviews
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => r.User.FirstName + " " + r.User.LastName)
                    .FirstOrDefault(),
                LatestReviewCreatedAt = p.Reviews
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => (DateTime?)r.CreatedAt)
                    .FirstOrDefault(),
            })
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<ProgramWithStatsDto?> GetByIdPublicWithStatsAsync(Guid id)
    {
        return await _context.TrainingPrograms
            .AsNoTracking()
            .Where(p => p.Id == id && !p.IsDeleted)
            .Select(p => new ProgramWithStatsDto
            {
                Program = p,
                TrainerFullName = p.Trainer.FirstName + " " + p.Trainer.LastName,
                TrainerAvatarUrl = p.Trainer.AvatarUrl,
                TrainerSlug = p.Trainer.TrainerProfile != null ? p.Trainer.TrainerProfile.Slug : "",
                TrainerRole = p.Trainer.Role.ToString(),
                AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => (double)r.Rating) : 0,
                TotalReviews = p.Reviews.Count(),
                TotalPurchases = p.Purchases.Count(pu => pu.Status == ProgramPurchaseStatus.Active),
                StandardSpotsUsed = p.Purchases.Count(pu => pu.Tier == ProgramTier.Standard && pu.Status == ProgramPurchaseStatus.Active),
                ProSpotsUsed = p.Purchases.Count(pu => pu.Tier == ProgramTier.Pro && pu.Status == ProgramPurchaseStatus.Active),
                LatestReviewComment = p.Reviews
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => r.Comment)
                    .FirstOrDefault(),
                LatestReviewRating = p.Reviews
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => (int?)r.Rating)
                    .FirstOrDefault(),
                LatestReviewUserName = p.Reviews
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => r.User.FirstName + " " + r.User.LastName)
                    .FirstOrDefault(),
                LatestReviewCreatedAt = p.Reviews
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => (DateTime?)r.CreatedAt)
                    .FirstOrDefault(),
            })
            .FirstOrDefaultAsync();
    }

    public async Task<ProgramWithStatsDto?> GetByCodeWithStatsAsync(string code)
    {
        return await _context.TrainingPrograms
            .AsNoTracking()
            .Where(p => p.Code == code && !p.IsDeleted)
            .Select(p => new ProgramWithStatsDto
            {
                Program = p,
                AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => (double)r.Rating) : 0,
                TotalReviews = p.Reviews.Count(),
                TotalPurchases = p.Purchases.Count(pu => pu.Status == ProgramPurchaseStatus.Active),
            })
            .FirstOrDefaultAsync();
    }

    public async Task<ProgramWithStatsDto?> GetStatsForProgramAsync(Guid programId)
    {
        return await _context.TrainingPrograms
            .AsNoTracking()
            .Where(p => p.Id == programId)
            .Select(p => new ProgramWithStatsDto
            {
                Program = p,
                AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => (double)r.Rating) : 0,
                TotalReviews = p.Reviews.Count(),
                TotalPurchases = p.Purchases.Count(pu => pu.Status == ProgramPurchaseStatus.Active),
            })
            .FirstOrDefaultAsync();
    }

    public async Task<TrainingProgram> CreateAsync(TrainingProgram program)
    {
        _context.TrainingPrograms.Add(program);
        await _context.SaveChangesAsync();
        return program;
    }

    public async Task UpdateAsync(TrainingProgram program)
    {
        _context.TrainingPrograms.Update(program);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var program = await GetByIdAsync(id);
        if (program != null)
        {
            program.IsDeleted = true;
            program.DeletedAt = DateTime.UtcNow;
            await UpdateAsync(program);
        }
    }

    public async Task<bool> IsCodeUniqueAsync(string code, Guid? excludeProgramId = null)
    {
        // Use IgnoreQueryFilters to check against ALL programs (including soft-deleted)
        // because the unique index on Code column applies to all records
        var query = _context.TrainingPrograms
            .IgnoreQueryFilters()
            .Where(p => p.Code == code);
        
        if (excludeProgramId.HasValue)
        {
            query = query.Where(p => p.Id != excludeProgramId.Value);
        }

        return !await query.AnyAsync();
    }
}
