using FeedEngine.Domain.Enums;

namespace FeedEngine.Domain.Models;

/// <summary>
/// Base model for items that can appear in a ranked feed.
/// </summary>
public abstract class FeedItem
{
    public required Guid Id { get; set; }

    public required DateTime CreatedAt { get; set; }

    public required Guid AuthorId { get; set; }

    public string? AuthorDisplayName { get; set; }

    public string? AuthorAvatarUrl { get; set; }

    public required FeedItemType ItemType { get; set; }

    /// <summary>
    /// Calculated score used for ordering results.
    /// </summary>
    public double Score { get; set; }
}
