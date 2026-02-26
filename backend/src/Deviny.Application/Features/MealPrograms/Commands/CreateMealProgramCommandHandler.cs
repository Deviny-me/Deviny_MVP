using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.MealPrograms.DTOs;
using Deviny.Application.Features.Notifications.Events;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using MediatR;
using System.Text.Json;

namespace Deviny.Application.Features.MealPrograms.Commands;

public class CreateMealProgramCommandHandler : IRequestHandler<CreateMealProgramCommand, MealProgramDto>
{
    private readonly IMealProgramRepository _mealProgramRepository;
    private readonly IUserRepository _userRepository;
    private readonly ILevelService _levelService;
    private readonly IAchievementService _achievementService;
    private readonly IMediator _mediator;
    private readonly string _uploadsPath;

    public CreateMealProgramCommandHandler(
        IMealProgramRepository mealProgramRepository,
        IUserRepository userRepository,
        ILevelService levelService,
        IAchievementService achievementService,
        IMediator mediator)
    {
        _mealProgramRepository = mealProgramRepository;
        _userRepository = userRepository;
        _levelService = levelService;
        _achievementService = achievementService;
        _mediator = mediator;
        _uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "meal-programs");

        if (!Directory.Exists(_uploadsPath))
            Directory.CreateDirectory(_uploadsPath);
    }

    public async Task<MealProgramDto> Handle(CreateMealProgramCommand request, CancellationToken ct)
    {
        if (request.CoverImage == null)
            throw new ArgumentException("Необходимо загрузить обложку");

        var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
        var coverExtension = Path.GetExtension(request.CoverImage.FileName).ToLowerInvariant();

        if (!imageExtensions.Contains(coverExtension))
            throw new ArgumentException("Неподдерживаемый формат изображения");

        if (request.CoverImage.Length > 5 * 1024 * 1024)
            throw new ArgumentException("Размер изображения превышает 5MB");

        var code = await GenerateUniqueCodeAsync(ct);

        var coverFileName = $"{Guid.NewGuid()}{coverExtension}";
        var coverFilePath = Path.Combine(_uploadsPath, coverFileName);
        await using (var stream = new FileStream(coverFilePath, FileMode.Create))
            await request.CoverImage.CopyToAsync(stream, ct);

        // Process videos
        var videoUrls = new List<string>();
        if (request.Videos != null && request.Videos.Any())
        {
            var videoExtensions = new[] { ".mp4", ".mov", ".avi", ".webm" };

            foreach (var video in request.Videos)
            {
                var videoExtension = Path.GetExtension(video.FileName).ToLowerInvariant();

                if (!videoExtensions.Contains(videoExtension))
                    throw new ArgumentException($"Неподдерживаемый формат видео: {video.FileName}");

                if (video.Length > 100 * 1024 * 1024)
                    throw new ArgumentException($"Размер видео {video.FileName} превышает 100MB");

                var videoFileName = $"{Guid.NewGuid()}{videoExtension}";
                var videoFilePath = Path.Combine(_uploadsPath, videoFileName);

                await using (var stream = new FileStream(videoFilePath, FileMode.Create))
                    await video.CopyToAsync(stream, ct);

                videoUrls.Add($"/uploads/meal-programs/{videoFileName}");
            }
        }

        var program = new MealProgram
        {
            Id = Guid.NewGuid(),
            TrainerId = request.TrainerId,
            Title = request.Title,
            Description = request.Description,
            DetailedDescription = request.DetailedDescription,
            Price = request.Price,
            ProPrice = request.ProPrice,
            IsPublic = request.IsPublic,
            Code = code,
            CoverImagePath = $"/uploads/meal-programs/{coverFileName}",
            VideosPath = JsonSerializer.Serialize(videoUrls),
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _mealProgramRepository.CreateAsync(program, ct);

        // Award XP
        try
        {
            await _levelService.AddXpAsync(
                request.TrainerId,
                XpEventType.TrainerCreatedProgram,
                50,
                $"CreatedMealProgram:{created.Id}",
                created.Id);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Warning: Failed to award XP for meal program creation: {ex.Message}");
        }

        // Check achievement
        try
        {
            await _achievementService.TryAwardAchievementAsync(
                request.TrainerId,
                "FIRST_PROGRAM_CREATED",
                AchievementSourceType.Program,
                created.Id,
                ct);

            // Nutritionist-specific achievement
            await _achievementService.TryAwardAchievementAsync(
                request.TrainerId,
                "FIRST_MEAL_PLAN",
                AchievementSourceType.Program,
                created.Id,
                ct);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Warning: Failed to check achievement for meal program creation: {ex.Message}");
        }

        // Publish notification event
        try
        {
            var trainer = await _userRepository.GetByIdAsync(request.TrainerId);
            var trainerName = trainer?.FullName ?? "Специалист";

            await _mediator.Publish(new MealProgramCreatedEvent
            {
                TrainerId = request.TrainerId,
                TrainerName = trainerName,
                ProgramId = created.Id,
                ProgramTitle = created.Title
            }, ct);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Warning: Failed to publish meal program created event: {ex.Message}");
        }

        var videoPaths = string.IsNullOrEmpty(created.VideosPath)
            ? new List<string>()
            : JsonSerializer.Deserialize<List<string>>(created.VideosPath) ?? new List<string>();

        return new MealProgramDto
        {
            Id = created.Id,
            Title = created.Title,
            Description = created.Description,
            DetailedDescription = created.DetailedDescription,
            Price = created.Price,
            ProPrice = created.ProPrice,
            Code = created.Code,
            CoverImageUrl = created.CoverImagePath,
            VideoUrls = videoPaths,
            IsPublic = created.IsPublic,
            CreatedAt = created.CreatedAt,
            UpdatedAt = created.UpdatedAt
        };
    }

    private async Task<string> GenerateUniqueCodeAsync(CancellationToken ct)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        string code;

        do
        {
            code = new string(Enumerable.Repeat(chars, 8)
                .Select(s => s[Random.Shared.Next(s.Length)]).ToArray());
        }
        while (!await _mealProgramRepository.IsCodeUniqueAsync(code, ct: ct));

        return code;
    }
}
