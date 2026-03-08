namespace Deviny.Application.Features.Reviews.DTOs;

public class ReviewDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserAvatarUrl { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ExpertReviewDto : ReviewDto
{
    public Guid ProgramId { get; set; }
    public string ProgramTitle { get; set; } = string.Empty;
    public string ProgramType { get; set; } = string.Empty;
}
