using Deviny.Domain.Enums;

namespace Deviny.Domain.Entities;

/// <summary>
/// Represents a media file (image or video) attached to a UserPost.
/// Stored separately to support:
/// - Multiple media per post (future carousel feature)
/// - Different storage backends (local, S3, Azure Blob)
/// - Video thumbnails
/// </summary>
public class PostMedia : BaseEntity
{
    /// <summary>
    /// The post this media belongs to.
    /// </summary>
    public required Guid PostId { get; set; }
    
    /// <summary>
    /// Navigation property to the parent UserPost.
    /// </summary>
    public UserPost Post { get; set; } = null!;
    
    /// <summary>
    /// Type of media (Image or Video).
    /// </summary>
    public required MediaType MediaType { get; set; }
    
    /// <summary>
    /// Relative path to the file in storage.
    /// Example: "/uploads/posts/images/abc123.jpg"
    /// </summary>
    public required string FilePath { get; set; }
    
    /// <summary>
    /// Relative path to the thumbnail image.
    /// Used for videos to show a preview.
    /// Nullable for MVP (thumbnail generation not implemented yet).
    /// </summary>
    public string? ThumbnailPath { get; set; }
    
    /// <summary>
    /// MIME type of the file.
    /// Example: "image/jpeg", "video/mp4"
    /// </summary>
    public required string ContentType { get; set; }
    
    /// <summary>
    /// File size in bytes.
    /// Used for storage quotas and validation.
    /// </summary>
    public required long SizeBytes { get; set; }
    
    /// <summary>
    /// Display order within the post.
    /// For future carousel support.
    /// </summary>
    public int DisplayOrder { get; set; } = 0;
}
