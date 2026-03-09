namespace FeedEngine.Domain.Enums;

/// <summary>
/// Role of a user in the system.
/// Used for author relevance / personalization logic.
/// </summary>
public enum UserRole
{
    User = 0,
    Trainer = 1,
    Admin = 2
}
