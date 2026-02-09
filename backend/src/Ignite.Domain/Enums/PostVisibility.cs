namespace Ignite.Domain.Enums;

/// <summary>
/// Visibility setting for a post.
/// Public posts are visible to all users.
/// Private posts are only visible to the owner.
/// </summary>
public enum PostVisibility
{
    Public = 0,
    Private = 1
}
