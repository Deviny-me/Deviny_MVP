using Microsoft.AspNetCore.Mvc;

namespace Deviny.API.Controllers;

/// <summary>
/// Upload files for chat messages.
/// Files are stored in /uploads/chat/ and served via static files middleware.
/// </summary>
[Route("api/chat/files")]
public class ChatFileController : BaseApiController
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<ChatFileController> _logger;

    private static readonly HashSet<string> AllowedImageTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"
    };

    private static readonly HashSet<string> AllowedDocTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "application/zip",
        "application/x-rar-compressed",
        "video/mp4",
        "video/quicktime",
        "audio/mpeg",
        "audio/wav"
    };

    private const long MaxFileSize = 25 * 1024 * 1024; // 25 MB

    public ChatFileController(IWebHostEnvironment env, ILogger<ChatFileController> logger)
    {
        _env = env;
        _logger = logger;
    }

    /// <summary>
    /// Upload a file for a chat message.
    /// Returns the file URL, name, content type, and size.
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(25 * 1024 * 1024)]
    public async Task<ActionResult<ChatFileUploadResult>> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided" });

        if (file.Length > MaxFileSize)
            return BadRequest(new { error = "File size exceeds 25 MB limit" });

        var contentType = file.ContentType;
        if (!AllowedImageTypes.Contains(contentType) && !AllowedDocTypes.Contains(contentType))
            return BadRequest(new { error = $"File type '{contentType}' is not allowed" });

        // Generate unique filename
        var ext = Path.GetExtension(file.FileName);
        var uniqueName = $"{Guid.NewGuid():N}{ext}";
        var uploadsDir = Path.Combine(_env.ContentRootPath, "uploads", "chat");

        Directory.CreateDirectory(uploadsDir);

        var filePath = Path.Combine(uploadsDir, uniqueName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var fileUrl = $"/uploads/chat/{uniqueName}";

        _logger.LogInformation("Chat file uploaded: {FileName} → {Url} ({Size} bytes)",
            file.FileName, fileUrl, file.Length);

        return Ok(new ChatFileUploadResult
        {
            Url = fileUrl,
            FileName = file.FileName,
            ContentType = contentType,
            Size = file.Length
        });
    }
}

public class ChatFileUploadResult
{
    public string Url { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
}
