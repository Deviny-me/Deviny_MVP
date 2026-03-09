using FeedEngine.Domain.Models;

namespace FeedEngine.Domain.Services;

public class FeedService : IFeedService
{
    private readonly IFeedRepository _repository;
    private readonly IFeedRankingService _rankingService;

    public FeedService(IFeedRepository repository, IFeedRankingService rankingService)
    {
        _repository = repository;
        _rankingService = rankingService;
    }

    public async Task<FeedPage<FeedItem>> GetFypAsync(Guid userId, int page, int pageSize, string? query, CancellationToken cancellationToken)
    {
        var followedIds = (await _repository.GetFollowedUserIdsAsync(userId, cancellationToken)).ToHashSet();

        var items = await LoadCandidateItemsAsync(query, cancellationToken);

        var ranked = _rankingService.RankItems(items, new FeedRankingOptions
        {
            CurrentUserId = userId,
            FollowedUserIds = followedIds,
            Now = DateTime.UtcNow
        });

        return Paginate(ranked, page, pageSize);
    }

    public async Task<FeedPage<FeedItem>> GetExploreAsync(int page, int pageSize, string? query, CancellationToken cancellationToken)
    {
        var items = await LoadCandidateItemsAsync(query, cancellationToken);

        var ranked = _rankingService.RankItems(items, new FeedRankingOptions
        {
            CurrentUserId = null,
            FollowedUserIds = new HashSet<Guid>(),
            Now = DateTime.UtcNow
        });

        return Paginate(ranked, page, pageSize);
    }

    private async Task<IReadOnlyList<FeedItem>> LoadCandidateItemsAsync(string? query, CancellationToken cancellationToken)
    {
        // Load a suitable window of content. Providers can control the limit.
        var posts = await _repository.GetRecentPostsAsync(200, query, cancellationToken);
        var achievements = await _repository.GetRecentAchievementsAsync(50, query, cancellationToken);
        var challenges = await _repository.GetRecentChallengesAsync(50, query, cancellationToken);

        // Merge into a single list for ranking.
        var combined = new List<FeedItem>(posts.Count + achievements.Count + challenges.Count);
        combined.AddRange(posts);
        combined.AddRange(achievements);
        combined.AddRange(challenges);
        return combined;
    }

    private static FeedPage<FeedItem> Paginate(IReadOnlyList<FeedItem> items, int page, int pageSize)
    {
        var pageIndex = Math.Max(page, 1);
        var size = Math.Clamp(pageSize, 1, 100);

        var skip = (pageIndex - 1) * size;
        var pageItems = items.Skip(skip).Take(size).ToArray();

        return new FeedPage<FeedItem>
        {
            Page = pageIndex,
            PageSize = size,
            TotalCount = items.Count,
            Items = pageItems
        };
    }
}
