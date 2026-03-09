namespace FeedEngine.Domain.Services;

public class FeedRankingOptions
{
    /// <summary>
    /// When ranking for a user (FYP), this is the current user id.
    /// For global explore, this may be null.
    /// </summary>
    public Guid? CurrentUserId { get; set; }

    /// <summary>
    /// Users the current user is following. Used for author relevance.
    /// </summary>
    public IReadOnlySet<Guid> FollowedUserIds { get; set; } = new HashSet<Guid>();

    /// <summary>
    /// Current time used for recency calculations.
    /// </summary>
    public DateTime Now { get; set; } = DateTime.UtcNow;
}
