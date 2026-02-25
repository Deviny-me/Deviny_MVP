namespace Deviny.Application.Features.MealPrograms.DTOs;

public class MealProgramDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? DetailedDescription { get; set; }
    public decimal Price { get; set; }
    public decimal? ProPrice { get; set; }
    public string Code { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public List<string> VideoUrls { get; set; } = new();
    public bool IsPublic { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class PublicMealProgramDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? ProPrice { get; set; }
    public string Code { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public List<string> VideoUrls { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public Guid TrainerId { get; set; }
    public string TrainerName { get; set; } = string.Empty;
    public string TrainerAvatarUrl { get; set; } = string.Empty;
    public string TrainerSlug { get; set; } = string.Empty;
    public string TrainerRole { get; set; } = string.Empty;
}
