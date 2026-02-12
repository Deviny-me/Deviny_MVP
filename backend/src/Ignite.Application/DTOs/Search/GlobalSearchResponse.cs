namespace Ignite.Application.DTOs.Search;

public class GlobalSearchResponse
{
    public List<UserSearchItem> Users { get; set; } = new();
    public List<ProgramSearchItem> WorkoutPrograms { get; set; } = new();
    public List<ProgramSearchItem> MealPrograms { get; set; } = new();
}

public class UserSearchItem
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public string? Slug { get; set; }
}

public class ProgramSearchItem
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? CoverImagePath { get; set; }
    public Guid TrainerId { get; set; }
    public string TrainerName { get; set; } = string.Empty;
    public string? TrainerSlug { get; set; }
}
