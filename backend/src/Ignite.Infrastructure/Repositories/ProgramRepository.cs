using Ignite.Application.Common.Interfaces;
using Ignite.Domain.Entities;
using Ignite.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ignite.Infrastructure.Repositories;

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
            .Include(p => p.Reviews)
            .Include(p => p.Purchases)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<TrainingProgram?> GetByCodeAsync(string code)
    {
        return await _context.TrainingPrograms
            .Include(p => p.Reviews)
            .Include(p => p.Purchases)
            .FirstOrDefaultAsync(p => p.Code == code);
    }

    public async Task<List<TrainingProgram>> GetByTrainerIdAsync(Guid trainerId)
    {
        return await _context.TrainingPrograms
            .Include(p => p.Reviews)
            .Include(p => p.Purchases)
            .Where(p => p.TrainerId == trainerId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<TrainingProgram>> GetAllPublicAsync()
    {
        return await _context.TrainingPrograms
            .Include(p => p.Reviews)
            .Include(p => p.Purchases)
            .Include(p => p.Trainer)
            .Where(p => !p.IsDeleted)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
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
        var query = _context.TrainingPrograms.Where(p => p.Code == code);
        
        if (excludeProgramId.HasValue)
        {
            query = query.Where(p => p.Id != excludeProgramId.Value);
        }

        return !await query.AnyAsync();
    }
}
