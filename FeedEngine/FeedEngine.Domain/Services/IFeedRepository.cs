using FeedEngine.Domain.Models;

namespace FeedEngine.Domain.Services;

/// <summary>
/// Data loader abstraction for retrieving candidate feed content.
/// </summary>
public interface IFeedRepository
{
    /// <summary>
    /// Load recent post feed items for ranking.
    /// </summary>
    Task<IReadOnlyList<PostFeedItem>> GetRecentPostsAsync(int limit, string? query, CancellationToken cancellationToken);

    /// <summary>
    /// Load recent achievements for ranking.
    /// </summary>
    Task<IReadOnlyList<AchievementFeedItem>> GetRecentAchievementsAsync(int limit, string? query, CancellationToken cancellationToken);

    /// <summary>
    /// Load recent challenges for ranking.
    /// </summary>
    Task<IReadOnlyList<ChallengeFeedItem>> GetRecentChallengesAsync(int limit, string? query, CancellationToken cancellationToken);

    /// <summary>
    /// Load the IDs of users that the given user is following. Used for personalization.
    /// </summary>
    Task<IReadOnlyList<Guid>> GetFollowedUserIdsAsync(Guid userId, CancellationToken cancellationToken);
}
