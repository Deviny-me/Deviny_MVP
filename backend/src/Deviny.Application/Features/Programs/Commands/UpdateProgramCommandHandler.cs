using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Programs.DTOs;
using Deviny.Domain.Enums;
using MediatR;
using System.Text.Json;

namespace Deviny.Application.Features.Programs.Commands;

public class UpdateProgramCommandHandler : IRequestHandler<UpdateProgramCommand, ProgramDto>
{
    private readonly IProgramRepository _programRepository;
    private readonly ILevelService _levelService;
    private readonly string _uploadsPath;

    public UpdateProgramCommandHandler(IProgramRepository programRepository, ILevelService levelService)
    {
        _programRepository = programRepository;
        _levelService = levelService;
        _uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "programs");
    }

    public async Task<ProgramDto> Handle(UpdateProgramCommand request, CancellationToken cancellationToken)
    {
        var program = await _programRepository.GetByIdAsync(request.Id);
        
        if (program == null)
        {
            throw new KeyNotFoundException("Программа не найдена");
        }

        if (program.TrainerId != request.TrainerId)
        {
            throw new UnauthorizedAccessException("Нет доступа к этой программе");
        }

        // Update basic fields
        program.Title = request.Title;
        program.Description = request.Description;
        program.Price = request.Price;
        program.UpdatedAt = DateTime.UtcNow;

        // Update cover image if provided
        if (request.CoverImage != null)
        {
            var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var extension = Path.GetExtension(request.CoverImage.FileName).ToLowerInvariant();
            
            if (!imageExtensions.Contains(extension))
            {
                throw new ArgumentException("Неподдерживаемый формат изображения");
            }

            if (request.CoverImage.Length > 5 * 1024 * 1024)
            {
                throw new ArgumentException("Размер изображения превышает 5MB");
            }

            // Delete old cover
            var oldCoverPath = Path.Combine(Directory.GetCurrentDirectory(), program.CoverImagePath.TrimStart('/'));
            if (File.Exists(oldCoverPath))
            {
                File.Delete(oldCoverPath);
            }

            // Save new cover
            var coverFileName = $"{Guid.NewGuid()}{extension}";
            var coverFilePath = Path.Combine(_uploadsPath, coverFileName);

            using (var stream = new FileStream(coverFilePath, FileMode.Create))
            {
                await request.CoverImage.CopyToAsync(stream, cancellationToken);
            }

            program.CoverImagePath = $"/uploads/programs/{coverFileName}";
        }

        // Update training videos if provided
        if (request.TrainingVideos != null && request.TrainingVideos.Any())
        {
            // Delete old videos
            var oldVideos = string.IsNullOrEmpty(program.TrainingVideosPath) 
                ? new List<string>() 
                : JsonSerializer.Deserialize<List<string>>(program.TrainingVideosPath) ?? new List<string>();
            
            foreach (var oldVideoPath in oldVideos)
            {
                var oldVideoFilePath = Path.Combine(Directory.GetCurrentDirectory(), oldVideoPath.TrimStart('/'));
                if (File.Exists(oldVideoFilePath))
                {
                    File.Delete(oldVideoFilePath);
                }
            }

            // Save new videos
            var videoUrls = new List<string>();
            var videoExtensions = new[] { ".mp4", ".mov", ".avi", ".webm" };
            
            foreach (var video in request.TrainingVideos)
            {
                var videoExtension = Path.GetExtension(video.FileName).ToLowerInvariant();
                
                if (!videoExtensions.Contains(videoExtension))
                {
                    throw new ArgumentException($"Неподдерживаемый формат видео: {video.FileName}");
                }

                if (video.Length > 100 * 1024 * 1024)
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

            program.TrainingVideosPath = JsonSerializer.Serialize(videoUrls);
        }

        await _programRepository.UpdateAsync(program);

        // Award XP to trainer for updating a program
        await _levelService.AddXpAsync(
            request.TrainerId,
            XpEventType.TrainerUpdatedProgram,
            25, // 25 XP for updating a program
            $"TrainerUpdatedProgram:{program.Id}:{DateTime.UtcNow.Ticks}",
            program.Id
        );

        // Calculate stats
        var avgRating = program.Reviews.Any() ? program.Reviews.Average(r => r.Rating) : 0;
        var totalReviews = program.Reviews.Count;
        var totalPurchases = program.Purchases.Count(p => p.Status == ProgramPurchaseStatus.Active);

        var videoPaths = string.IsNullOrEmpty(program.TrainingVideosPath) 
            ? new List<string>() 
            : JsonSerializer.Deserialize<List<string>>(program.TrainingVideosPath) ?? new List<string>();

        return new ProgramDto
        {
            Id = program.Id,
            Title = program.Title,
            Description = program.Description,
            Price = program.Price,
            Code = program.Code,
            CoverImageUrl = program.CoverImagePath,
            TrainingVideoUrls = videoPaths,
            AverageRating = avgRating,
            TotalReviews = totalReviews,
            TotalPurchases = totalPurchases,
            CreatedAt = program.CreatedAt,
            UpdatedAt = program.UpdatedAt
        };
    }
}
