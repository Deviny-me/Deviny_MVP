using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Repositories;

public class MealProgramRepository : IMealProgramRepository
{
    private readonly ApplicationDbContext _context;

    public MealProgramRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<MealProgram?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.MealPrograms
            .Include(p => p.Trainer)
            .FirstOrDefaultAsync(p => p.Id == id, ct);
    }

    public async Task<List<MealProgram>> GetByTrainerIdAsync(Guid trainerId, CancellationToken ct = default)
    {
        return await _context.MealPrograms
            .AsNoTracking()
            .Where(p => p.TrainerId == trainerId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<List<MealProgram>> GetAllPublicAsync(CancellationToken ct = default)
    {
        return await _context.MealPrograms
            .AsNoTracking()
            .Include(p => p.Trainer)
                .ThenInclude(u => u.TrainerProfile)
            .Where(p => !p.IsDeleted && p.IsPublic)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<MealProgram> CreateAsync(MealProgram program, CancellationToken ct = default)
    {
        _context.MealPrograms.Add(program);
        await _context.SaveChangesAsync(ct);
        return program;
    }

    public async Task UpdateAsync(MealProgram program, CancellationToken ct = default)
    {
        _context.MealPrograms.Update(program);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<bool> IsCodeUniqueAsync(string code, Guid? excludeId = null, CancellationToken ct = default)
    {
        var query = _context.MealPrograms
            .IgnoreQueryFilters()
            .Where(p => p.Code == code);

        if (excludeId.HasValue)
            query = query.Where(p => p.Id != excludeId.Value);

        return !await query.AnyAsync(ct);
    }
}
