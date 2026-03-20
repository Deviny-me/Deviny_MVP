namespace Deviny.API.DTOs.Requests;

/// <summary>
/// Request body for creating a comment.
/// </summary>
public class CreateCommentRequest
{
    public required string Content { get; set; }
    public Guid? ParentCommentId { get; set; }
}

