using FeedEngine.Domain.Models;

namespace FeedEngine.Domain.Services;

public interface IFeedRankingService
{
    /// <summary>
    /// Rank and score items according to recency, engagement, and author relevance.
    /// </summary>
    IReadOnlyList<FeedItem> RankItems(IEnumerable<FeedItem> items, FeedRankingOptions options);
}
