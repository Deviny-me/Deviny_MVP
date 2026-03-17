namespace Deviny.Application.Features.MealPrograms.DTOs;

public class MealProgramDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? DetailedDescription { get; set; }
    public decimal Price { get; set; }
    public decimal? StandardPrice { get; set; }
    public decimal? ProPrice { get; set; }
    public int? MaxStandardSpots { get; set; }
    public int? MaxProSpots { get; set; }
    public string Category { get; set; } = "Diet";
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
    public decimal? StandardPrice { get; set; }
    public decimal? ProPrice { get; set; }
    public int? MaxStandardSpots { get; set; }
    public int? MaxProSpots { get; set; }
    public int StandardSpotsRemaining { get; set; }
    public int ProSpotsRemaining { get; set; }
    public string Category { get; set; } = "Diet";
    public string Code { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public List<string> VideoUrls { get; set; } = new();
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public int TotalPurchases { get; set; }
    public string? LatestReviewComment { get; set; }
    public int? LatestReviewRating { get; set; }
    public string? LatestReviewUserName { get; set; }
    public DateTime? LatestReviewCreatedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid TrainerId { get; set; }
    public string TrainerName { get; set; } = string.Empty;
    public string TrainerAvatarUrl { get; set; } = string.Empty;
    public string TrainerSlug { get; set; } = string.Empty;
    public string TrainerRole { get; set; } = string.Empty;
}
