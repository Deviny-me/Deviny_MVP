using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Deviny.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Deviny.Infrastructure.Services;

public class VerificationDocumentService : IVerificationDocumentService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<VerificationDocumentService> _logger;
    
    private static readonly string[] AllowedExtensions = { ".pdf", ".jpg", ".jpeg", ".png" };
    private static readonly string[] AllowedMimeTypes = 
    { 
        "application/pdf", 
        "image/jpeg", 
        "image/jpg", 
        "image/png" 
    };
    private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

    public VerificationDocumentService(
        ApplicationDbContext context,
        ILogger<VerificationDocumentService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<VerificationDocument> SaveVerificationDocumentAsync(
        Guid userId, 
        IFormFile file, 
        CancellationToken cancellationToken = default)
    {
        if (!await ValidateFileAsync(file))
        {
            throw new ArgumentException("Invalid file. Allowed formats: PDF, JPG, PNG. Max size: 10MB");
        }

        // Create uploads directory if not exists
        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "verifications");
        Directory.CreateDirectory(uploadsDir);

        // Generate unique filename
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var uniqueFileName = $"{userId}_{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(uploadsDir, uniqueFileName);

        // Save file to disk
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        // Create database record
        var document = new VerificationDocument
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            FileName = file.FileName,
            FilePath = $"/uploads/verifications/{uniqueFileName}",
            FileType = file.ContentType,
            FileSize = file.Length,
            Status = VerificationStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.VerificationDocuments.Add(document);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Verification document saved: {FileName} for user {UserId}", 
            file.FileName, 
            userId);

        return document;
    }

    public async Task<IEnumerable<VerificationDocument>> GetUserDocumentsAsync(Guid userId)
    {
        return await _context.VerificationDocuments
            .AsNoTracking()
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    public Task<bool> ValidateFileAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return Task.FromResult(false);

        if (file.Length > MaxFileSize)
            return Task.FromResult(false);

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            return Task.FromResult(false);

        if (!AllowedMimeTypes.Contains(file.ContentType.ToLowerInvariant()))
            return Task.FromResult(false);

        return Task.FromResult(true);
    }
}
