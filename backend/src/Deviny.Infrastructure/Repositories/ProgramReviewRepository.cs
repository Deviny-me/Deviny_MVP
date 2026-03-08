using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Repositories;

public class ProgramReviewRepository : IProgramReviewRepository
{
    private readonly ApplicationDbContext _context;

    public ProgramReviewRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProgramReview> CreateAsync(ProgramReview review)
    {
        _context.ProgramReviews.Add(review);
        await _context.SaveChangesAsync();
        return review;
    }

    public async Task<List<ProgramReview>> GetByProgramAsync(Guid programId, ProgramType programType)
    {
        return await _context.ProgramReviews
            .AsNoTracking()
            .Include(r => r.User)
            .Where(r => r.ProgramType == programType &&
                (programType == ProgramType.Training
                    ? r.TrainingProgramId == programId
                    : r.MealProgramId == programId))
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<ProgramReview>> GetByExpertAsync(Guid expertId)
    {
        return await _context.ProgramReviews
            .AsNoTracking()
            .Include(r => r.User)
            .Include(r => r.TrainingProgram)
            .Include(r => r.MealProgram)
            .Where(r =>
                (r.TrainingProgram != null && r.TrainingProgram.TrainerId == expertId) ||
                (r.MealProgram != null && r.MealProgram.TrainerId == expertId))
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> ExistsAsync(Guid userId, Guid programId, ProgramType programType)
    {
        return await _context.ProgramReviews
            .AsNoTracking()
            .AnyAsync(r =>
                r.UserId == userId &&
                r.ProgramType == programType &&
                (programType == ProgramType.Training
                    ? r.TrainingProgramId == programId
                    : r.MealProgramId == programId));
    }
}
