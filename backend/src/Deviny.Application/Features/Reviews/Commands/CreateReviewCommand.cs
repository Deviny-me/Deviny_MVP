using MediatR;

namespace Deviny.Application.Features.Reviews.Commands;

public class CreateReviewCommand : IRequest<CreateReviewResult>
{
    public Guid UserId { get; set; }
    public Guid ProgramId { get; set; }
    public string ProgramType { get; set; } = string.Empty; // "training" or "meal"
    public int Rating { get; set; }
    public string? Comment { get; set; }
}

public class CreateReviewResult
{
    public bool Success { get; set; }
    public Guid? ReviewId { get; set; }
    public string? Error { get; set; }

    public static CreateReviewResult Ok(Guid reviewId) => new() { Success = true, ReviewId = reviewId };
    public static CreateReviewResult Fail(string error) => new() { Success = false, Error = error };
}
