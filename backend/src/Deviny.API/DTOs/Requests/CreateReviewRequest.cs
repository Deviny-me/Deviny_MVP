namespace Deviny.API.DTOs.Requests;

/// <summary>
/// Request body for creating a review
/// </summary>
public class CreateReviewRequest
{
    public Guid ProgramId { get; set; }
    public string ProgramType { get; set; } = string.Empty; // "training" or "meal"
    public int Rating { get; set; }
    public string? Comment { get; set; }
}

