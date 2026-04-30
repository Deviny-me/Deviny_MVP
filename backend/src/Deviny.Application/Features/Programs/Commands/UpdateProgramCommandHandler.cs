using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Programs.DTOs;
using Deviny.Domain.Enums;
using MediatR;

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
        program.DetailedDescription = request.DetailedDescription;
        program.Price = request.Price;
        program.StandardPrice = request.StandardPrice;
        program.ProPrice = request.ProPrice;
        program.MaxStandardSpots = request.MaxStandardSpots;
        program.MaxProSpots = request.MaxProSpots;
        program.IsPublic = request.IsPublic;
        program.UpdatedAt = DateTime.UtcNow;

        // Update cover image if provided
        if (request.CoverImage != null)
        {
            var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".heic", ".heif", ".avif", ".jfif" };
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
            var oldVideos = ProgramVideoJsonHelper.Parse(program.TrainingVideosPath)
                .Select(v => v.VideoUrl)
                .ToList();
            
            foreach (var oldVideoPath in oldVideos)
            {
                var oldVideoFilePath = Path.Combine(Directory.GetCurrentDirectory(), oldVideoPath.TrimStart('/'));
                if (File.Exists(oldVideoFilePath))
                {
                    File.Delete(oldVideoFilePath);
                }
            }

            // Save new videos
            var videos = new List<ProgramVideoDto>();
            var titles = request.TrainingVideoTitles ?? new List<string>();
            var descriptions = request.TrainingVideoDescriptions ?? new List<string>();
            var videoExtensions = new[] { ".mp4", ".mov", ".avi", ".webm", ".m4v", ".mkv", ".mpeg", ".mpg", ".3gp", ".wmv" };
            
            for (var i = 0; i < request.TrainingVideos.Count; i++)
            {
                var video = request.TrainingVideos[i];
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

                videos.Add(new ProgramVideoDto
                {
                    VideoUrl = $"/uploads/programs/{videoFileName}",
                    Title = i < titles.Count ? (titles[i] ?? string.Empty) : string.Empty,
                    Description = i < descriptions.Count ? (descriptions[i] ?? string.Empty) : string.Empty,
                });
            }

            program.TrainingVideosPath = ProgramVideoJsonHelper.Serialize(videos);
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

        // Calculate stats via SQL projection instead of loading Reviews/Purchases collections
        var stats = await _programRepository.GetStatsForProgramAsync(program.Id);
        var avgRating = stats?.AverageRating ?? 0;
        var totalReviews = stats?.TotalReviews ?? 0;
        var totalPurchases = stats?.TotalPurchases ?? 0;

        var videoMetadata = ProgramVideoJsonHelper.Parse(program.TrainingVideosPath);
        var videoPaths = videoMetadata.Select(v => v.VideoUrl).ToList();

        return new ProgramDto
        {
            Id = program.Id,
            Title = program.Title,
            Description = program.Description,
            DetailedDescription = program.DetailedDescription,
            Price = program.Price,
            StandardPrice = program.StandardPrice,
            ProPrice = program.ProPrice,
            MaxStandardSpots = program.MaxStandardSpots,
            MaxProSpots = program.MaxProSpots,
            Category = program.Category.ToString(),
            Code = program.Code,
            CoverImageUrl = program.CoverImagePath,
            TrainingVideoUrls = videoPaths,
            TrainingVideos = videoMetadata,
            IsPublic = program.IsPublic,
            AverageRating = avgRating,
            TotalReviews = totalReviews,
            TotalPurchases = totalPurchases,
            CreatedAt = program.CreatedAt,
            UpdatedAt = program.UpdatedAt
        };
    }
}
