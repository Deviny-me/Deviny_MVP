namespace FeedEngine.Infrastructure.Persistence.Entities;

public class UserEntity
{
    public required Guid Id { get; set; }
    public required DateTime CreatedAt { get; set; }
    public required DateTime UpdatedAt { get; set; }

    public required string Username { get; set; }
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
}
