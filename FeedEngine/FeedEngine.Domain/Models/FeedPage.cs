namespace FeedEngine.Domain.Models;

public class FeedPage<TItem>
    where TItem : FeedItem
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public IReadOnlyList<TItem> Items { get; set; } = Array.Empty<TItem>();
}
