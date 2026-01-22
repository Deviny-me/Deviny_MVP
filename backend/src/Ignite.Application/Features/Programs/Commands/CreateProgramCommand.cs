using Ignite.Application.Common.Interfaces;
using Ignite.Application.Features.Programs.DTOs;
using Ignite.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Text.Json;

namespace Ignite.Application.Features.Programs.Commands;

public class CreateProgramCommand : IRequest<ProgramDto>
{
    public Guid TrainerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public IFormFile? CoverImage { get; set; }
    public List<IFormFile>? TrainingVideos { get; set; }
}

public class CreateProgramCommandHandler : IRequestHandler<CreateProgramCommand, ProgramDto>
{
    private readonly IProgramRepository _programRepository;
    private readonly string _uploadsPath;

    public CreateProgramCommandHandler(IProgramRepository programRepository)
    {
        _programRepository = programRepository;
        _uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "programs");
        
        if (!Directory.Exists(_uploadsPath))
        {
            Directory.CreateDirectory(_uploadsPath);
        }
    }

    public async Task<ProgramDto> Handle(CreateProgramCommand request, CancellationToken cancellationToken)
    {
        // Validate cover image
        if (request.CoverImage == null)
        {
            throw new ArgumentException("Необходимо загрузить обложку");
        }

        var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
        var coverExtension = Path.GetExtension(request.CoverImage.FileName).ToLowerInvariant();
        
        if (!imageExtensions.Contains(coverExtension))
        {
            throw new ArgumentException("Неподдерживаемый формат изображения");
        }

        if (request.CoverImage.Length > 5 * 1024 * 1024)
        {
            throw new ArgumentException("Размер изображения превышает 5MB");
        }

        // Generate unique code
        var code = await GenerateUniqueCodeAsync();

        // Save cover image
        var coverFileName = $"{Guid.NewGuid()}{coverExtension}";
        var coverFilePath = Path.Combine(_uploadsPath, coverFileName);

        using (var stream = new FileStream(coverFilePath, FileMode.Create))
        {
            await request.CoverImage.CopyToAsync(stream, cancellationToken);
        }

        // Save training videos
        var videoUrls = new List<string>();
        if (request.TrainingVideos != null && request.TrainingVideos.Any())
        {
            var videoExtensions = new[] { ".mp4", ".mov", ".avi", ".webm" };
            
            foreach (var video in request.TrainingVideos)
            {
                var videoExtension = Path.GetExtension(video.FileName).ToLowerInvariant();
                
                if (!videoExtensions.Contains(videoExtension))
                {
                    throw new ArgumentException($"Неподдерживаемый формат видео: {video.FileName}");
                }

                if (video.Length > 100 * 1024 * 1024) // 100MB per video
                {
                    throw new ArgumentException($"Размер видео {video.FileName} превышает 100MB");
                }

                var videoFileName = $"{Guid.NewGuid()}{videoExtension}";
                var videoFilePath = Path.Combine(_uploadsPath, videoFileName);

                using (var stream = new FileStream(videoFilePath, FileMode.Create))
                {
                    await video.CopyToAsync(stream, cancellationToken);
                }

                videoUrls.Add($"/uploads/programs/{videoFileName}");
            }
        }

        var program = new TrainingProgram
        {
            Id = Guid.NewGuid(),
            TrainerId = request.TrainerId,
            Title = request.Title,
            Description = request.Description,
            Price = request.Price,
            Code = code,
            CoverImagePath = $"/uploads/programs/{coverFileName}",
            TrainingVideosPath = JsonSerializer.Serialize(videoUrls),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        var created = await _programRepository.CreateAsync(program);

        var videoPaths = string.IsNullOrEmpty(created.TrainingVideosPath) 
            ? new List<string>() 
            : JsonSerializer.Deserialize<List<string>>(created.TrainingVideosPath) ?? new List<string>();

        return new ProgramDto
        {
            Id = created.Id,
            Title = created.Title,
            Description = created.Description,
            Price = created.Price,
            Code = created.Code,
            CoverImageUrl = $"http://localhost:5000{created.CoverImagePath}",
            TrainingVideoUrls = videoPaths.Select(v => $"http://localhost:5000{v}").ToList(),
            AverageRating = 0,
            TotalReviews = 0,
            TotalPurchases = 0,
            CreatedAt = created.CreatedAt,
            UpdatedAt = created.UpdatedAt
        };
    }

    private async Task<string> GenerateUniqueCodeAsync()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        string code;
        
        do
        {
            code = new string(Enumerable.Repeat(chars, 8)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        } 
        while (!await _programRepository.IsCodeUniqueAsync(code));

        return code;
    }
}
