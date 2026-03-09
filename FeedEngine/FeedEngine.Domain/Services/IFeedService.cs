using FeedEngine.Domain.Models;

namespace FeedEngine.Domain.Services;

public interface IFeedService
{
    Task<FeedPage<FeedItem>> GetFypAsync(Guid userId, int page, int pageSize, string? query, CancellationToken cancellationToken);
    Task<FeedPage<FeedItem>> GetExploreAsync(int page, int pageSize, string? query, CancellationToken cancellationToken);
}
