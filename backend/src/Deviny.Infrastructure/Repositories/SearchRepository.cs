using Deviny.Application.Common.Interfaces;
using Deviny.Application.DTOs.Search;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Repositories;

public class SearchRepository : ISearchRepository
{
    private readonly ApplicationDbContext _context;

    public SearchRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserSearchItem>> SearchUsersAsync(string query, int limit, CancellationToken ct = default)
    {
        var q = query.Trim().ToLower();

        // Fetch matching users — SQL Server collation is CI by default,
        // but we use EF.Functions.Like for safe pattern matching
        var users = await _context.Users
            .AsNoTracking()
            .Where(u => u.IsActive &&
                (u.FirstName.ToLower().Contains(q) ||
                 u.LastName.ToLower().Contains(q) ||
                 (u.FirstName + " " + u.LastName).ToLower().Contains(q) ||
                 u.Email.ToLower().StartsWith(q) ||
                 (u.Slug != null && u.Slug.ToLower().Contains(q))))
            .Take(limit)
            .Select(u => new
            {
                u.Id,
                FullName = u.FirstName + " " + u.LastName,
                u.AvatarUrl,
                u.Role,
                u.Slug,
                u.FirstName,
                u.LastName
            })
            .ToListAsync(ct);

        // Rank in memory: StartsWith higher than Contains
        return users
            .OrderByDescending(u =>
                u.FirstName.StartsWith(q, StringComparison.OrdinalIgnoreCase) ||
                u.LastName.StartsWith(q, StringComparison.OrdinalIgnoreCase) ? 1 : 0)
            .ThenBy(u => u.FullName)
            .Select(u => new UserSearchItem
            {
                Id = u.Id,
                FullName = u.FullName,
                AvatarUrl = u.AvatarUrl,
                Role = u.Role.ToString(),
                Slug = u.Slug
            })
            .ToList();
    }

    public async Task<List<ProgramSearchItem>> SearchTrainingProgramsAsync(string query, int limit, CancellationToken ct = default)
    {
        var q = query.Trim().ToLower();

        var programs = await _context.TrainingPrograms
            .AsNoTracking()
            .Where(p =>
                p.Code.ToLower().Contains(q) ||
                p.Title.ToLower().Contains(q) ||
                p.Description.ToLower().Contains(q))
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.Title,
                p.Code,
                p.Price,
                p.CoverImagePath,
                p.TrainerId,
                TrainerName = p.Trainer.FirstName + " " + p.Trainer.LastName,
                TrainerSlug = p.Trainer.Slug
            })
            .ToListAsync(ct);

        // Rank in memory: exact Code match first, then StartsWith title
        return programs
            .OrderByDescending(p => p.Code.Equals(q, StringComparison.OrdinalIgnoreCase) ? 1 : 0)
            .ThenByDescending(p => p.Title.StartsWith(q, StringComparison.OrdinalIgnoreCase) ? 1 : 0)
            .ThenBy(p => p.Title)
            .Select(p => new ProgramSearchItem
            {
                Id = p.Id,
                Title = p.Title,
                Code = p.Code,
                Price = p.Price,
                CoverImagePath = p.CoverImagePath,
                TrainerId = p.TrainerId,
                TrainerName = p.TrainerName,
                TrainerSlug = p.TrainerSlug
            })
            .ToList();
    }

    public async Task<List<ProgramSearchItem>> SearchMealProgramsAsync(string query, int limit, CancellationToken ct = default)
    {
        var q = query.Trim().ToLower();

        var programs = await _context.MealPrograms
            .AsNoTracking()
            .Where(p =>
                p.Code.ToLower().Contains(q) ||
                p.Title.ToLower().Contains(q) ||
                p.Description.ToLower().Contains(q))
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.Title,
                p.Code,
                p.Price,
                p.CoverImagePath,
                p.TrainerId,
                TrainerName = p.Trainer.FirstName + " " + p.Trainer.LastName,
                TrainerSlug = p.Trainer.Slug
            })
            .ToListAsync(ct);

        return programs
            .OrderByDescending(p => p.Code.Equals(q, StringComparison.OrdinalIgnoreCase) ? 1 : 0)
            .ThenByDescending(p => p.Title.StartsWith(q, StringComparison.OrdinalIgnoreCase) ? 1 : 0)
            .ThenBy(p => p.Title)
            .Select(p => new ProgramSearchItem
            {
                Id = p.Id,
                Title = p.Title,
                Code = p.Code,
                Price = p.Price,
                CoverImagePath = p.CoverImagePath,
                TrainerId = p.TrainerId,
                TrainerName = p.TrainerName,
                TrainerSlug = p.TrainerSlug
            })
            .ToList();
    }
}
