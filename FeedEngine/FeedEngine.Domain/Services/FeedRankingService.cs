using FeedEngine.Domain.Models;

namespace FeedEngine.Domain.Services;

/// <summary>
/// Default ranking algorithm. Scores items based on recency, engagement, and author relevance.
/// </summary>
public class FeedRankingService : IFeedRankingService
{
    public IReadOnlyList<FeedItem> RankItems(IEnumerable<FeedItem> items, FeedRankingOptions options)
    {
        var now = options.Now;
        var followed = options.FollowedUserIds ?? new HashSet<Guid>();

        return items
            .Select(item =>
            {
                double score = 0;

                // Recency: newer items get higher score.
                var age = now - item.CreatedAt;
                score += RecencyScore(age);

                // Engagement: use available fields when present.
                if (item is PostFeedItem post)
                {
                    score += EngagementScore(post.LikeCount, post.CommentCount, post.RepostCount);
                }

                // Author relevance: boost if user follows author.
                if (options.CurrentUserId != null && followed.Contains(item.AuthorId))
                {
                    score += 15;
                }

                item.Score = score;
                return item;
            })
            .OrderByDescending(i => i.Score)
            .ThenByDescending(i => i.CreatedAt)
            .ToArray();
    }

    private static double RecencyScore(TimeSpan age)
    {
        // Recent items are more relevant. Uses logarithmic decay.
        var hours = Math.Max(age.TotalHours, 0.0);
        return 100.0 / (1.0 + Math.Log10(1 + hours));
    }

    private static double EngagementScore(int likes, int comments, int reposts)
    {
        // Weighted engagement: prioritize shares/likes, but also comments.
        return likes * 0.6 + comments * 0.8 + reposts * 1.2;
    }
}
