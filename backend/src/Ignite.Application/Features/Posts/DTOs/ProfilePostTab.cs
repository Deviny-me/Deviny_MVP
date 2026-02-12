namespace Ignite.Application.Features.Posts.DTOs;

/// <summary>
/// Profile publications tab filter.
/// Determines which posts to show in a user's profile.
/// </summary>
public enum ProfilePostTab
{
    /// <summary>All posts (original + reposts). Default.</summary>
    All = 0,
    
    /// <summary>Only video posts created by the user (excludes reposts).</summary>
    Videos = 1,
    
    /// <summary>Only reposted content.</summary>
    Reposts = 2
}
