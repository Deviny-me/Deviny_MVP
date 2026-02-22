using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.MealPrograms.DTOs;
using Deviny.Domain.Enums;
using MediatR;
using System.Text.Json;

namespace Deviny.Application.Features.MealPrograms.Commands;

public class UpdateMealProgramCommandHandler : IRequestHandler<UpdateMealProgramCommand, MealProgramDto>
{
    private readonly IMealProgramRepository _mealProgramRepository;
    private readonly ILevelService _levelService;
    private readonly string _uploadsPath;

    public UpdateMealProgramCommandHandler(
        IMealProgramRepository mealProgramRepository,
        ILevelService levelService)
    {
        _mealProgramRepository = mealProgramRepository;
        _levelService = levelService;
        _uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "meal-programs");

        if (!Directory.Exists(_uploadsPath))
            Directory.CreateDirectory(_uploadsPath);
    }

    public async Task<MealProgramDto> Handle(UpdateMealProgramCommand request, CancellationToken ct)
    {
        var program = await _mealProgramRepository.GetByIdAsync(request.Id, ct);

        if (program == null)
            throw new KeyNotFoundException("Программа питания не найдена");

        if (program.TrainerId != request.TrainerId)
            throw new UnauthorizedAccessException("Нет доступа к этой программе");

        program.Title = request.Title;
        program.Description = request.Description;
        program.DetailedDescription = request.DetailedDescription;
        program.Price = request.Price;
        program.UpdatedAt = DateTime.UtcNow;

        if (request.CoverImage != null)
        {
            var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var extension = Path.GetExtension(request.CoverImage.FileName).ToLowerInvariant();

            if (!imageExtensions.Contains(extension))
                throw new ArgumentException("Неподдерживаемый формат изображения");

            if (request.CoverImage.Length > 5 * 1024 * 1024)
                throw new ArgumentException("Размер изображения превышает 5MB");

            // Delete old cover
            if (!string.IsNullOrEmpty(program.CoverImagePath))
            {
                var oldCoverPath = Path.Combine(Directory.GetCurrentDirectory(), program.CoverImagePath.TrimStart('/'));
                if (File.Exists(oldCoverPath))
                    File.Delete(oldCoverPath);
            }

            // Save new cover
            var coverFileName = $"{Guid.NewGuid()}{extension}";
            var coverFilePath = Path.Combine(_uploadsPath, coverFileName);

            if (!Directory.Exists(_uploadsPath))
                Directory.CreateDirectory(_uploadsPath);

            await using (var stream = new FileStream(coverFilePath, FileMode.Create))
                await request.CoverImage.CopyToAsync(stream, ct);

            program.CoverImagePath = $"/uploads/meal-programs/{coverFileName}";
        }

        // Process videos
        if (request.Videos != null && request.Videos.Any())
        {
            var videoExtensions = new[] { ".mp4", ".mov", ".avi", ".webm" };

            // Validate ALL new videos FIRST (before deleting old ones)
            foreach (var video in request.Videos)
            {
                var videoExtension = Path.GetExtension(video.FileName).ToLowerInvariant();

                if (!videoExtensions.Contains(videoExtension))
                    throw new ArgumentException($"Неподдерживаемый формат видео: {video.FileName}");

                if (video.Length > 100 * 1024 * 1024)
                    throw new ArgumentException($"Размер видео {video.FileName} превышает 100MB");
            }

            // Delete old videos (validation passed)
            if (!string.IsNullOrEmpty(program.VideosPath))
            {
                var oldVideoUrls = JsonSerializer.Deserialize<List<string>>(program.VideosPath) ?? new List<string>();
                foreach (var oldUrl in oldVideoUrls)
                {
                    var oldVideoPath = Path.Combine(Directory.GetCurrentDirectory(), oldUrl.TrimStart('/'));
                    if (File.Exists(oldVideoPath))
                        File.Delete(oldVideoPath);
                }
            }

            // Save new videos
            var videoUrls = new List<string>();
            foreach (var video in request.Videos)
            {
                var videoExtension = Path.GetExtension(video.FileName).ToLowerInvariant();
                var videoFileName = $"{Guid.NewGuid()}{videoExtension}";
                var videoFilePath = Path.Combine(_uploadsPath, videoFileName);

                await using (var stream = new FileStream(videoFilePath, FileMode.Create))
                    await video.CopyToAsync(stream, ct);

                videoUrls.Add($"/uploads/meal-programs/{videoFileName}");
            }

            program.VideosPath = JsonSerializer.Serialize(videoUrls);
        }

        await _mealProgramRepository.UpdateAsync(program, ct);

        // Award XP
        try
        {
            await _levelService.AddXpAsync(
                request.TrainerId,
                XpEventType.TrainerUpdatedProgram,
                25,
                $"UpdatedMealProgram:{program.Id}:{DateTime.UtcNow.Ticks}",
                program.Id);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Warning: Failed to award XP for meal program update: {ex.Message}");
        }

        var videoPaths = string.IsNullOrEmpty(program.VideosPath)
            ? new List<string>()
            : JsonSerializer.Deserialize<List<string>>(program.VideosPath) ?? new List<string>();

        return new MealProgramDto
        {
            Id = program.Id,
            Title = program.Title,
            Description = program.Description,
            DetailedDescription = program.DetailedDescription,
            Price = program.Price,
            Code = program.Code,
            CoverImageUrl = program.CoverImagePath,
            VideoUrls = videoPaths,
            CreatedAt = program.CreatedAt,
            UpdatedAt = program.UpdatedAt
        };
    }
}
