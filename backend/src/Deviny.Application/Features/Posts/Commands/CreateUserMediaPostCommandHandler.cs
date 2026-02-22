using Deviny.Application.Common;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.Common.Settings;
using Deviny.Application.Features.Posts.DTOs;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Deviny.Application.Features.Posts.Commands;

/// <summary>
/// Handler for CreateUserMediaPostCommand.
/// Creates a new post with media file upload.
/// 
/// Uses IFileStorageService abstraction for file operations,
/// making it easy to switch storage backends without code changes.
/// </summary>
public class CreateUserMediaPostCommandHandler 
    : IRequestHandler<CreateUserMediaPostCommand, Result<PostDto>>
{
    private readonly IUserPostRepository _postRepository;
    private readonly IFileStorageService _fileStorage;
    private readonly IUserRepository _userRepository;
    private readonly ILevelService _levelService;
    private readonly IAchievementService _achievementService;
    private readonly FileStorageSettings _storageSettings;
    private readonly ILogger<CreateUserMediaPostCommandHandler> _logger;

    public CreateUserMediaPostCommandHandler(
        IUserPostRepository postRepository,
        IFileStorageService fileStorage,
        IUserRepository userRepository,
        ILevelService levelService,
        IAchievementService achievementService,
        IOptions<FileStorageSettings> storageSettings,
        ILogger<CreateUserMediaPostCommandHandler> logger)
    {
        _postRepository = postRepository;
        _fileStorage = fileStorage;
        _userRepository = userRepository;
        _levelService = levelService;
        _achievementService = achievementService;
        _storageSettings = storageSettings.Value;
        _logger = logger;
    }

    public async Task<Result<PostDto>> Handle(
        CreateUserMediaPostCommand request, 
        CancellationToken cancellationToken)
    {
        // Verify user exists
        var user = await _userRepository.GetByIdAsync(request.UserId);
        if (user == null)
        {
            return Result.Failure<PostDto>(Error.UserNotFound);
        }

        // Validate file
        var validationResult = ValidateFile(request);
        if (validationResult.IsFailure)
        {
            return Result.Failure<PostDto>(validationResult.Error);
        }

        // Determine storage folder and media type
        var (folder, mediaType) = request.Type switch
        {
            PostType.Photo => ("posts/images", MediaType.Image),
            PostType.Video => ("posts/videos", MediaType.Video),
            _ => throw new ArgumentException($"Unsupported post type: {request.Type}")
        };

        // Upload file
        await using var stream = request.File.OpenReadStream();
        var uploadResult = await _fileStorage.UploadAsync(
            stream,
            request.File.FileName,
            request.File.ContentType,
            folder,
            cancellationToken);

        if (uploadResult.IsFailure)
        {
            _logger.LogError("Failed to upload file for user {UserId}: {Error}", 
                request.UserId, uploadResult.Error.Message);
            return Result.Failure<PostDto>(uploadResult.Error);
        }

        // Create post entity
        var now = DateTime.UtcNow;
        var postId = Guid.NewGuid();
        var post = new UserPost
        {
            Id = postId,
            UserId = request.UserId,
            Type = request.Type,
            Caption = request.Caption?.Trim(),
            Visibility = request.Visibility,
            CreatedAt = now,
            UpdatedAt = now,
            Media = new List<PostMedia>
            {
                new PostMedia
                {
                    Id = Guid.NewGuid(),
                    PostId = postId,
                    MediaType = mediaType,
                    FilePath = uploadResult.Value.RelativePath,
                    ContentType = uploadResult.Value.ContentType,
                    SizeBytes = uploadResult.Value.SizeBytes,
                    DisplayOrder = 0,
                    CreatedAt = now,
                    UpdatedAt = now
                }
            }
        };

        // Save to database
        try
        {
            await _postRepository.CreateAsync(post, cancellationToken);
            
            _logger.LogInformation(
                "Created {PostType} post {PostId} for user {UserId}", 
                request.Type, post.Id, request.UserId);
            
            // Award XP for creating a post
            // Determine event type based on user role
            try
            {
                var xpEventType = (user.Role == UserRole.Trainer || user.Role == UserRole.Nutritionist)
                    ? XpEventType.TrainerCreatedPost 
                    : XpEventType.UserCreatedPost;
                
                await _levelService.AddXpAsync(
                    request.UserId,
                    xpEventType,
                    10, // 10 XP for creating a post
                    $"CreatedPost:{post.Id}",
                    post.Id
                );
                
                _logger.LogInformation(
                    "Awarded 10 XP to user {UserId} for creating post {PostId}",
                    request.UserId, post.Id);
            }
            catch (Exception xpEx)
            {
                // Log but don't fail - post was already created successfully
                _logger.LogWarning(xpEx, 
                    "Failed to award XP for post creation. User: {UserId}, Post: {PostId}",
                    request.UserId, post.Id);
            }

            // Try to award achievement for first post
            try
            {
                await _achievementService.TryAwardAchievementAsync(
                    request.UserId,
                    "FIRST_POST",
                    AchievementSourceType.Post,
                    post.Id,
                    cancellationToken);

                // Nutritionist-specific achievement
                await _achievementService.TryAwardAchievementAsync(
                    request.UserId,
                    "NUTRI_FIRST_POST",
                    AchievementSourceType.Post,
                    post.Id,
                    cancellationToken);
            }
            catch (Exception achEx)
            {
                _logger.LogWarning(achEx,
                    "Failed to check achievement for post creation. User: {UserId}, Post: {PostId}",
                    request.UserId, post.Id);
            }
            
            // Map to DTO
            var dto = MapToDto(post, user);
            return Result.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save post for user {UserId}", request.UserId);
            
            // Cleanup uploaded file on failure
            await _fileStorage.DeleteAsync(uploadResult.Value.RelativePath, cancellationToken);
            
            return Result.Failure<PostDto>(Error.PostCreationFailed);
        }
    }

    private Result ValidateFile(CreateUserMediaPostCommand request)
    {
        if (request.File == null || request.File.Length == 0)
        {
            return Result.Failure(Error.FileNotProvided);
        }

        var extension = Path.GetExtension(request.File.FileName).ToLowerInvariant();
        var contentType = request.File.ContentType.ToLowerInvariant();

        switch (request.Type)
        {
            case PostType.Photo:
                if (request.File.Length > _storageSettings.MaxImageSizeBytes)
                {
                    return Result.Failure(Error.Custom(
                        "File.TooLarge", 
                        $"Image size exceeds maximum allowed ({_storageSettings.MaxImageSizeBytes / 1024 / 1024}MB)"));
                }
                if (!_storageSettings.AllowedImageExtensions.Contains(extension))
                {
                    return Result.Failure(Error.FileExtensionNotAllowed);
                }
                if (!_storageSettings.AllowedImageContentTypes.Contains(contentType))
                {
                    return Result.Failure(Error.FileTypeNotAllowed);
                }
                break;
                
            case PostType.Video:
                if (request.File.Length > _storageSettings.MaxVideoSizeBytes)
                {
                    return Result.Failure(Error.Custom(
                        "File.TooLarge", 
                        $"Video size exceeds maximum allowed ({_storageSettings.MaxVideoSizeBytes / 1024 / 1024}MB)"));
                }
                if (!_storageSettings.AllowedVideoExtensions.Contains(extension))
                {
                    return Result.Failure(Error.FileExtensionNotAllowed);
                }
                if (!_storageSettings.AllowedVideoContentTypes.Contains(contentType))
                {
                    return Result.Failure(Error.FileTypeNotAllowed);
                }
                break;
                
            default:
                return Result.Failure(Error.PostTypeInvalid);
        }

        return Result.Success();
    }

    private PostDto MapToDto(UserPost post, User? user = null)
    {
        return new PostDto
        {
            Id = post.Id,
            UserId = post.UserId,
            Author = user != null ? new PostAuthorDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                AvatarUrl = user.AvatarUrl,
                Slug = user.Slug,
                Role = user.Role
            } : null,
            Type = post.Type,
            Caption = post.Caption,
            Visibility = post.Visibility,
            CreatedAt = post.CreatedAt,
            Media = post.Media.Select(m => new PostMediaDto
            {
                Id = m.Id,
                MediaType = m.MediaType,
                Url = _fileStorage.GetPublicUrl(m.FilePath),
                ThumbnailUrl = m.ThumbnailPath != null 
                    ? _fileStorage.GetPublicUrl(m.ThumbnailPath) 
                    : null,
                ContentType = m.ContentType,
                SizeBytes = m.SizeBytes,
                DisplayOrder = m.DisplayOrder
            }).ToList()
        };
    }
}
