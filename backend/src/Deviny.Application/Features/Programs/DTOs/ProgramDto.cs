namespace Deviny.Application.Features.Programs.DTOs;

public class ProgramDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Code { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public List<string> TrainingVideoUrls { get; set; } = new List<string>();
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public int TotalPurchases { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
