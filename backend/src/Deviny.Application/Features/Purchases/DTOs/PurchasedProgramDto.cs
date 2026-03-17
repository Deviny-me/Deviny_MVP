using Deviny.Domain.Enums;
using Deviny.Application.Features.Programs.DTOs;

namespace Deviny.Application.Features.Purchases.DTOs;

public class PurchasedProgramDto
{
    public Guid PurchaseId { get; set; }
    public Guid ProgramId { get; set; }
    public string ProgramType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public List<string> VideoUrls { get; set; } = new();
    public List<ProgramVideoDto> Videos { get; set; } = new();
    public string Tier { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public DateTime PurchasedAt { get; set; }
    public string TrainerName { get; set; } = string.Empty;
    public string TrainerAvatarUrl { get; set; } = string.Empty;
    public Guid TrainerId { get; set; }
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public string PurchaseStatus { get; set; } = "Active";
    public bool CanReview { get; set; }
    public bool HasReviewed { get; set; }
}
