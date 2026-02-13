namespace Deviny.Application.Common.Settings;

/// <summary>
/// Configuration settings for file storage.
/// Follows IOptions pattern for strongly-typed configuration.
/// 
/// In appsettings.json:
/// {
///   "FileStorage": {
///     "BaseUrl": "http://localhost:5000",
///     "BasePath": "uploads",
///     "MaxImageSizeBytes": 10485760,
///     "MaxVideoSizeBytes": 104857600,
///     "AllowedImageExtensions": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
///     "AllowedVideoExtensions": [".mp4", ".mov", ".webm"],
///     "AllowedImageContentTypes": ["image/jpeg", "image/png", "image/gif", "image/webp"],
///     "AllowedVideoContentTypes": ["video/mp4", "video/quicktime", "video/webm"]
///   }
/// }
/// </summary>
public class FileStorageSettings
{
    public const string SectionName = "FileStorage";
    
    /// <summary>
    /// Base URL for constructing public file URLs.
    /// For local: "http://localhost:5000"
    /// For production: "https://api.Deviny.com" or CDN URL
    /// </summary>
    public string BaseUrl { get; set; } = "http://localhost:5000";
    
    /// <summary>
    /// Base path for file storage relative to application root.
    /// </summary>
    public string BasePath { get; set; } = "uploads";
    
    /// <summary>
    /// Maximum allowed image file size in bytes. Default: 10 MB
    /// </summary>
    public long MaxImageSizeBytes { get; set; } = 10 * 1024 * 1024;
    
    /// <summary>
    /// Maximum allowed video file size in bytes. Default: 100 MB
    /// </summary>
    public long MaxVideoSizeBytes { get; set; } = 100 * 1024 * 1024;
    
    /// <summary>
    /// Allowed image file extensions.
    /// </summary>
    public string[] AllowedImageExtensions { get; set; } = 
        [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    
    /// <summary>
    /// Allowed video file extensions.
    /// </summary>
    public string[] AllowedVideoExtensions { get; set; } = 
        [".mp4", ".mov", ".webm"];
    
    /// <summary>
    /// Allowed image MIME types.
    /// </summary>
    public string[] AllowedImageContentTypes { get; set; } = 
        ["image/jpeg", "image/png", "image/gif", "image/webp"];
    
    /// <summary>
    /// Allowed video MIME types.
    /// </summary>
    public string[] AllowedVideoContentTypes { get; set; } = 
        ["video/mp4", "video/quicktime", "video/webm"];
}
