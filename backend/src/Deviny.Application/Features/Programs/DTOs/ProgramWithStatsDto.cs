using Deviny.Domain.Entities;

namespace Deviny.Application.Features.Programs.DTOs;

/// <summary>
/// Lightweight projection of a TrainingProgram with SQL-computed stats.
/// Avoids loading Reviews/Purchases collections into memory.
/// </summary>
public class ProgramWithStatsDto
{
    public TrainingProgram Program { get; set; } = null!;
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public int TotalPurchases { get; set; }
    public int StandardSpotsUsed { get; set; }
    public int ProSpotsUsed { get; set; }

    // Trainer info (populated for public queries)
    public string? TrainerFullName { get; set; }
    public string? TrainerAvatarUrl { get; set; }
    public string? TrainerSlug { get; set; }
    public string? TrainerRole { get; set; }
}
