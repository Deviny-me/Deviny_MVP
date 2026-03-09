using FeedEngine.Domain.Enums;

namespace FeedEngine.Infrastructure.Persistence.Entities;

public class UserPostEntity
{
    public required Guid Id { get; set; }
    public required Guid UserId { get; set; }
    public required DateTime CreatedAt { get; set; }
    public required DateTime UpdatedAt { get; set; }

    public required PostType Type { get; set; }
    public string? Caption { get; set; }
    public PostVisibility Visibility { get; set; } = PostVisibility.Public;

    public bool IsDeleted { get; set; }

    public Guid? OriginalPostId { get; set; }
}
