using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Programs.DTOs;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using MediatR;
using System.Text.Json;

namespace Deviny.Application.Features.Programs.Commands;

public class CreateProgramCommandHandler : IRequestHandler<CreateProgramCommand, ProgramDto>
{
    private readonly IProgramRepository _programRepository;
    private readonly ILevelService _levelService;
    private readonly string _uploadsPath;

    public CreateProgramCommandHandler(IProgramRepository programRepository, ILevelService levelService)
    {
        _programRepository = programRepository;
        _levelService = levelService;
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

        // Award XP to trainer for creating a program
        // Wrap in try-catch so XP failure doesn't fail the program creation
        try
        {
            await _levelService.AddXpAsync(
                request.TrainerId,
                XpEventType.TrainerCreatedProgram,
                50, // 50 XP for creating a program
                $"TrainerCreatedProgram:{created.Id}",
                created.Id
            );
        }
        catch (Exception ex)
        {
            // Log but don't fail - program was already created successfully
            Console.Error.WriteLine($"Warning: Failed to award XP for program creation: {ex.Message}");
        }

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
            CoverImageUrl = created.CoverImagePath,
            TrainingVideoUrls = videoPaths,
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
