using FeedEngine.Domain.Enums;

namespace FeedEngine.Domain.Models;

public class PostFeedItem : FeedItem
{
    public required PostType PostType { get; set; }

    public string? Caption { get; set; }

    public PostVisibility Visibility { get; set; } = PostVisibility.Public;

    public int LikeCount { get; set; }
    public int CommentCount { get; set; }
    public int RepostCount { get; set; }

    public string? MediaUrl { get; set; }
}
