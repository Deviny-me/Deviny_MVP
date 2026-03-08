using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Repositories;

public class ProgramPurchaseRepository : IProgramPurchaseRepository
{
    private readonly ApplicationDbContext _context;

    public ProgramPurchaseRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProgramPurchase> CreateAsync(ProgramPurchase purchase)
    {
        _context.ProgramPurchases.Add(purchase);
        await _context.SaveChangesAsync();
        return purchase;
    }

    public async Task<List<ProgramPurchase>> GetByUserIdAsync(Guid userId)
    {
        return await _context.ProgramPurchases
            .AsNoTracking()
            .Include(pp => pp.TrainingProgram)
                .ThenInclude(tp => tp!.Trainer)
            .Include(pp => pp.TrainingProgram)
                .ThenInclude(tp => tp!.Reviews)
            .Include(pp => pp.MealProgram)
                .ThenInclude(mp => mp!.Trainer)
            .Include(pp => pp.MealProgram)
                .ThenInclude(mp => mp!.Reviews)
            .Where(pp => pp.UserId == userId && pp.Status == ProgramPurchaseStatus.Active)
            .OrderByDescending(pp => pp.PurchasedAt)
            .ToListAsync();
    }

    public async Task<bool> ExistsAsync(Guid userId, Guid programId, ProgramType programType, ProgramTier tier)
    {
        return await _context.ProgramPurchases
            .AsNoTracking()
            .AnyAsync(pp =>
                pp.UserId == userId &&
                pp.ProgramType == programType &&
                pp.Tier == tier &&
                pp.Status == ProgramPurchaseStatus.Active &&
                (programType == ProgramType.Training
                    ? pp.TrainingProgramId == programId
                    : pp.MealProgramId == programId));
    }

    public async Task<int> CountByProgramAndTierAsync(Guid programId, ProgramType programType, ProgramTier tier)
    {
        return await _context.ProgramPurchases
            .AsNoTracking()
            .CountAsync(pp =>
                pp.ProgramType == programType &&
                pp.Tier == tier &&
                pp.Status == ProgramPurchaseStatus.Active &&
                (programType == ProgramType.Training
                    ? pp.TrainingProgramId == programId
                    : pp.MealProgramId == programId));
    }

    public async Task<bool> HasCompletedPurchaseAsync(Guid userId, Guid programId, ProgramType programType)
    {
        return await _context.ProgramPurchases
            .AsNoTracking()
            .AnyAsync(pp =>
                pp.UserId == userId &&
                pp.ProgramType == programType &&
                pp.Status == ProgramPurchaseStatus.Completed &&
                (programType == ProgramType.Training
                    ? pp.TrainingProgramId == programId
                    : pp.MealProgramId == programId));
    }
}
