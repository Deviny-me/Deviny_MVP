namespace Deviny.Application.Features.Programs.DTOs;

public class PublicProgramDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? ProPrice { get; set; }
    public string Code { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public int TotalPurchases { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Trainer info
    public Guid TrainerId { get; set; }
    public string TrainerName { get; set; } = string.Empty;
    public string TrainerAvatarUrl { get; set; } = string.Empty;
    public string TrainerSlug { get; set; } = string.Empty;
}
