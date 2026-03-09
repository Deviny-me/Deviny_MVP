namespace FeedEngine.Domain.Entities;

/// <summary>
/// Minimal representation of a user in the feed engine.
/// This mirrors the production schema in Deviny.Domain but keeps the feed engine decoupled.
/// </summary>
public class User : BaseEntity
{
    public required string Username { get; set; }
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
}
