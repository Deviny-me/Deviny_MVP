namespace Deviny.Application.Features.Programs.DTOs;

public class ProgramDto
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
    public string Category { get; set; } = "Training";
    public string Code { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public List<string> TrainingVideoUrls { get; set; } = new List<string>();
    public List<ProgramVideoDto> TrainingVideos { get; set; } = new List<ProgramVideoDto>();
    public bool IsPublic { get; set; } = true;
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public int TotalPurchases { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
