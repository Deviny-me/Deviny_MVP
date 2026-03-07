using Deviny.Domain.Enums;
using Deviny.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Deviny.API.Controllers;

[Authorize]
[Route("api/dashboard")]
public class DashboardStatsController : BaseApiController
{
    private readonly ApplicationDbContext _context;

    public DashboardStatsController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get dashboard statistics for the current trainer or nutritionist.
    /// Includes total students, programs sold, revenue breakdown by month, and per-program stats.
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var userId = GetCurrentUserId();
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
            return Unauthorized();

        if (user.Role != UserRole.Trainer && user.Role != UserRole.Nutritionist)
            return Forbid();

        var isTrainer = user.Role == UserRole.Trainer;

        // Get all active purchases for this trainer/nutritionist's programs
        var purchasesQuery = _context.ProgramPurchases
            .AsNoTracking()
            .Where(pp => pp.Status == ProgramPurchaseStatus.Active || pp.Status == ProgramPurchaseStatus.Completed);

        if (isTrainer)
        {
            // Trainers own both training programs and meal programs
            purchasesQuery = purchasesQuery.Where(pp =>
                (pp.TrainingProgram != null && pp.TrainingProgram.TrainerId == userId && !pp.TrainingProgram.IsDeleted) ||
                (pp.MealProgram != null && pp.MealProgram.TrainerId == userId && !pp.MealProgram.IsDeleted));
        }
        else
        {
            // Nutritionists own only meal programs
            purchasesQuery = purchasesQuery.Where(pp =>
                pp.MealProgram != null && pp.MealProgram.TrainerId == userId && !pp.MealProgram.IsDeleted);
        }

        var purchases = await purchasesQuery
            .Include(pp => pp.User)
            .Include(pp => pp.TrainingProgram)
            .Include(pp => pp.MealProgram)
            .ToListAsync();

        // Total unique students
        var totalStudents = purchases.Select(pp => pp.UserId).Distinct().Count();

        // Total programs sold (purchase count)
        var totalProgramsSold = purchases.Count;

        // Programs owned
        int totalPrograms;
        if (isTrainer)
        {
            var trainingCount = await _context.TrainingPrograms
                .AsNoTracking()
                .CountAsync(tp => tp.TrainerId == userId && !tp.IsDeleted);
            var mealCount = await _context.MealPrograms
                .AsNoTracking()
                .CountAsync(mp => mp.TrainerId == userId && !mp.IsDeleted);
            totalPrograms = trainingCount + mealCount;
        }
        else
        {
            totalPrograms = await _context.MealPrograms
                .AsNoTracking()
                .CountAsync(mp => mp.TrainerId == userId && !mp.IsDeleted);
        }

        // Monthly sales for the last 12 months
        var now = DateTime.UtcNow;
        var twelveMonthsAgo = now.AddMonths(-11).Date;
        twelveMonthsAgo = new DateTime(twelveMonthsAgo.Year, twelveMonthsAgo.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var monthlySales = purchases
            .Where(pp => pp.PurchasedAt >= twelveMonthsAgo)
            .GroupBy(pp => new { pp.PurchasedAt.Year, pp.PurchasedAt.Month })
            .Select(g => new MonthlySalesDto
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Sales = g.Count(),
                Students = g.Select(pp => pp.UserId).Distinct().Count()
            })
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .ToList();

        // Fill in missing months with zeros
        var filledMonthlySales = new List<MonthlySalesDto>();
        for (var i = 0; i < 12; i++)
        {
            var date = twelveMonthsAgo.AddMonths(i);
            var existing = monthlySales.FirstOrDefault(m => m.Year == date.Year && m.Month == date.Month);
            filledMonthlySales.Add(existing ?? new MonthlySalesDto
            {
                Year = date.Year,
                Month = date.Month,
                Sales = 0,
                Students = 0
            });
        }

        // Per-program breakdown
        var programStats = new List<ProgramStatsDto>();

        if (isTrainer)
        {
            // Training programs
            var trainingPrograms = await _context.TrainingPrograms
                .AsNoTracking()
                .Where(tp => tp.TrainerId == userId && !tp.IsDeleted)
                .ToListAsync();

            foreach (var tp in trainingPrograms)
            {
                var programPurchases = purchases
                    .Where(pp => pp.TrainingProgramId == tp.Id)
                    .ToList();
                programStats.Add(new ProgramStatsDto
                {
                    ProgramId = tp.Id,
                    Title = tp.Title,
                    Type = "training",
                    Category = tp.Category.ToString(),
                    TotalSales = programPurchases.Count,
                    UniqueStudents = programPurchases.Select(pp => pp.UserId).Distinct().Count(),
                    BasicSales = programPurchases.Count(pp => pp.Tier == ProgramTier.Basic),
                    StandardSales = programPurchases.Count(pp => pp.Tier == ProgramTier.Standard),
                    ProSales = programPurchases.Count(pp => pp.Tier == ProgramTier.Pro),
                });
            }
        }

        // Meal programs (both trainers and nutritionists can have them)
        var mealPrograms = await _context.MealPrograms
            .AsNoTracking()
            .Where(mp => mp.TrainerId == userId && !mp.IsDeleted)
            .ToListAsync();

        foreach (var mp in mealPrograms)
        {
            var programPurchases = purchases
                .Where(pp => pp.MealProgramId == mp.Id)
                .ToList();
            programStats.Add(new ProgramStatsDto
            {
                ProgramId = mp.Id,
                Title = mp.Title,
                Type = "meal",
                Category = mp.Category.ToString(),
                TotalSales = programPurchases.Count,
                UniqueStudents = programPurchases.Select(pp => pp.UserId).Distinct().Count(),
                BasicSales = programPurchases.Count(pp => pp.Tier == ProgramTier.Basic),
                StandardSales = programPurchases.Count(pp => pp.Tier == ProgramTier.Standard),
                ProSales = programPurchases.Count(pp => pp.Tier == ProgramTier.Pro),
            });
        }

        // Tier distribution
        var tierDistribution = new TierDistributionDto
        {
            Basic = purchases.Count(pp => pp.Tier == ProgramTier.Basic),
            Standard = purchases.Count(pp => pp.Tier == ProgramTier.Standard),
            Pro = purchases.Count(pp => pp.Tier == ProgramTier.Pro),
        };

        // Recent students (last 10 unique)
        var recentStudents = purchases
            .OrderByDescending(pp => pp.PurchasedAt)
            .Select(pp => pp.User)
            .Where(u => u != null)
            .DistinctBy(u => u.Id)
            .Take(10)
            .Select(u => new RecentStudentDto
            {
                Id = u.Id,
                FullName = u.FullName,
                AvatarUrl = u.AvatarUrl,
                Email = u.Email,
            })
            .ToList();

        return Ok(new DashboardStatsResponse
        {
            TotalStudents = totalStudents,
            TotalProgramsSold = totalProgramsSold,
            TotalPrograms = totalPrograms,
            MonthlySales = filledMonthlySales,
            ProgramStats = programStats.OrderByDescending(p => p.TotalSales).ToList(),
            TierDistribution = tierDistribution,
            RecentStudents = recentStudents,
        });
    }
}

// --- Response DTOs ---

public class DashboardStatsResponse
{
    public int TotalStudents { get; set; }
    public int TotalProgramsSold { get; set; }
    public int TotalPrograms { get; set; }
    public List<MonthlySalesDto> MonthlySales { get; set; } = new();
    public List<ProgramStatsDto> ProgramStats { get; set; } = new();
    public TierDistributionDto TierDistribution { get; set; } = new();
    public List<RecentStudentDto> RecentStudents { get; set; } = new();
}

public class MonthlySalesDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int Sales { get; set; }
    public int Students { get; set; }
}

public class ProgramStatsDto
{
    public Guid ProgramId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int TotalSales { get; set; }
    public int UniqueStudents { get; set; }
    public int BasicSales { get; set; }
    public int StandardSales { get; set; }
    public int ProSales { get; set; }
}

public class TierDistributionDto
{
    public int Basic { get; set; }
    public int Standard { get; set; }
    public int Pro { get; set; }
}

public class RecentStudentDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Email { get; set; } = string.Empty;
}
