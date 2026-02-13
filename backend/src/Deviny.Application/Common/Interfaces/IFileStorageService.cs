namespace Deviny.Application.Common.Interfaces;

/// <summary>
/// Abstraction for file storage operations.
/// This interface allows easy replacement of storage implementation:
/// - LocalFileStorageService for development/small deployments
/// - S3FileStorageService for AWS
/// - AzureBlobStorageService for Azure
/// - MinioFileStorageService for self-hosted S3-compatible storage
/// 
/// When migrating to microservices, this can become a separate File Storage microservice
/// with its own API, and this interface can be replaced with an HTTP client.
/// </summary>
public interface IFileStorageService
{
    /// <summary>
    /// Uploads a file to storage and returns the relative URL path.
    /// </summary>
    /// <param name="fileStream">The file content stream</param>
    /// <param name="fileName">Original file name with extension</param>
    /// <param name="contentType">MIME type of the file</param>
    /// <param name="folder">Target folder/container (e.g., "posts/images", "posts/videos")</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Result with relative URL path on success, or error on failure</returns>
    Task<Result<FileUploadResult>> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string folder,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a file from storage.
    /// </summary>
    /// <param name="filePath">Relative path of the file to delete</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Result indicating success or failure</returns>
    Task<Result> DeleteAsync(string filePath, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the full URL for a file path.
    /// For local storage: combines base URL with relative path
    /// For cloud storage: generates signed URL if needed
    /// </summary>
    /// <param name="relativePath">Relative path of the file</param>
    /// <returns>Full URL to access the file</returns>
    string GetPublicUrl(string relativePath);
    
    /// <summary>
    /// Checks if a file exists in storage.
    /// </summary>
    /// <param name="filePath">Relative path of the file</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if file exists</returns>
    Task<bool> ExistsAsync(string filePath, CancellationToken cancellationToken = default);
}

/// <summary>
/// Result of a successful file upload operation.
/// </summary>
public sealed record FileUploadResult(
    string RelativePath,
    string PublicUrl,
    string ContentType,
    long SizeBytes);
