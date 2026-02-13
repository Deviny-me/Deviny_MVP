using Deviny.Application.Common;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.Common.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Deviny.Infrastructure.Services;

/// <summary>
/// Local file system implementation of IFileStorageService.
/// Stores files on the local disk under the configured base path.
/// 
/// For microservices migration:
/// - Replace with S3FileStorageService, AzureBlobStorageService, etc.
/// - Or create a dedicated File Storage microservice and use HTTP client
/// - The interface remains the same, no changes needed in handlers
/// </summary>
public class LocalFileStorageService : IFileStorageService
{
    private readonly FileStorageSettings _settings;
    private readonly ILogger<LocalFileStorageService> _logger;
    private readonly string _basePath;

    public LocalFileStorageService(
        IOptions<FileStorageSettings> settings,
        ILogger<LocalFileStorageService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
        _basePath = Path.Combine(Directory.GetCurrentDirectory(), _settings.BasePath);
        
        // Ensure base directory exists
        EnsureDirectoryExists(_basePath);
    }

    public async Task<Result<FileUploadResult>> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string folder,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Generate unique file name to avoid collisions
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            
            // Build full path: basePath/folder/uniqueFileName
            var folderPath = Path.Combine(_basePath, folder);
            EnsureDirectoryExists(folderPath);
            
            var fullPath = Path.Combine(folderPath, uniqueFileName);
            
            // Get file size before copying
            var sizeBytes = fileStream.Length;
            
            // Save file to disk
            await using var fileStreamOut = new FileStream(
                fullPath, 
                FileMode.Create, 
                FileAccess.Write, 
                FileShare.None,
                bufferSize: 81920, // 80KB buffer for better performance
                useAsync: true);
            
            await fileStream.CopyToAsync(fileStreamOut, cancellationToken);
            
            // Build relative path for DB storage
            var relativePath = $"/{_settings.BasePath}/{folder}/{uniqueFileName}";
            var publicUrl = GetPublicUrl(relativePath);
            
            _logger.LogInformation(
                "File uploaded successfully: {RelativePath}, Size: {SizeBytes} bytes",
                relativePath, sizeBytes);
            
            return Result.Success(new FileUploadResult(
                relativePath,
                publicUrl,
                contentType,
                sizeBytes));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload file: {FileName}", fileName);
            return Result.Failure<FileUploadResult>(Error.FileUploadFailed);
        }
    }

    public async Task<Result> DeleteAsync(string filePath, CancellationToken cancellationToken = default)
    {
        try
        {
            // Convert relative path to absolute path
            var absolutePath = GetAbsolutePath(filePath);
            
            if (!File.Exists(absolutePath))
            {
                _logger.LogWarning("File not found for deletion: {FilePath}", filePath);
                return Result.Success(); // Consider non-existent file as successfully deleted
            }
            
            await Task.Run(() => File.Delete(absolutePath), cancellationToken);
            
            _logger.LogInformation("File deleted successfully: {FilePath}", filePath);
            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete file: {FilePath}", filePath);
            return Result.Failure(Error.Custom("File.DeleteFailed", "Failed to delete the file."));
        }
    }

    public string GetPublicUrl(string relativePath)
    {
        // Ensure path starts with /
        if (!relativePath.StartsWith("/"))
        {
            relativePath = "/" + relativePath;
        }
        
        return $"{_settings.BaseUrl.TrimEnd('/')}{relativePath}";
    }

    public async Task<bool> ExistsAsync(string filePath, CancellationToken cancellationToken = default)
    {
        var absolutePath = GetAbsolutePath(filePath);
        return await Task.FromResult(File.Exists(absolutePath));
    }

    private string GetAbsolutePath(string relativePath)
    {
        // Remove leading slash and base path prefix if present
        var cleanPath = relativePath.TrimStart('/');
        
        if (cleanPath.StartsWith(_settings.BasePath))
        {
            cleanPath = cleanPath.Substring(_settings.BasePath.Length).TrimStart('/');
        }
        
        return Path.Combine(_basePath, cleanPath.Replace('/', Path.DirectorySeparatorChar));
    }

    private static void EnsureDirectoryExists(string path)
    {
        if (!Directory.Exists(path))
        {
            Directory.CreateDirectory(path);
        }
    }
}
