namespace Ignite.Domain.Enums;

/// <summary>
/// Type of user post.
/// Photo and Video are media posts.
/// Achievement is a special post type for sharing unlocked achievements (future feature).
/// Repost is a share of another user's post.
/// </summary>
public enum PostType
{
    Photo = 0,
    Video = 1,
    Achievement = 2,
    Repost = 3
}
