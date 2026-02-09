using FluentValidation;
using Ignite.Application.Common.Settings;
using Ignite.Application.Features.Posts.Commands;
using Ignite.Domain.Enums;
using Microsoft.Extensions.Options;

namespace Ignite.Application.Features.Posts.Validators;

/// <summary>
/// FluentValidation validator for CreateUserMediaPostCommand.
/// Validates file type, size, and caption length.
/// 
/// This validator runs automatically via ValidationBehavior pipeline.
/// </summary>
public class CreateUserMediaPostCommandValidator 
    : AbstractValidator<CreateUserMediaPostCommand>
{
    private readonly FileStorageSettings _settings;

    public CreateUserMediaPostCommandValidator(IOptions<FileStorageSettings> settings)
    {
        _settings = settings.Value;

        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("User ID is required.");

        RuleFor(x => x.Type)
            .IsInEnum()
            .WithMessage("Invalid post type.")
            .Must(type => type == PostType.Photo || type == PostType.Video)
            .WithMessage("Only Photo and Video post types are currently supported.");

        RuleFor(x => x.File)
            .NotNull()
            .WithMessage("File is required.");

        RuleFor(x => x.File.Length)
            .GreaterThan(0)
            .When(x => x.File != null)
            .WithMessage("File cannot be empty.");

        RuleFor(x => x.Caption)
            .MaximumLength(500)
            .WithMessage("Caption cannot exceed 500 characters.");

        // Custom validation for file based on post type
        RuleFor(x => x)
            .Custom((command, context) =>
            {
                if (command.File == null) return;

                var extension = Path.GetExtension(command.File.FileName).ToLowerInvariant();
                var contentType = command.File.ContentType.ToLowerInvariant();

                if (command.Type == PostType.Photo)
                {
                    if (command.File.Length > _settings.MaxImageSizeBytes)
                    {
                        context.AddFailure("File", 
                            $"Image size exceeds maximum allowed ({_settings.MaxImageSizeBytes / 1024 / 1024}MB).");
                    }

                    if (!_settings.AllowedImageExtensions.Contains(extension))
                    {
                        context.AddFailure("File", 
                            $"Image extension '{extension}' is not allowed. Allowed: {string.Join(", ", _settings.AllowedImageExtensions)}");
                    }

                    if (!_settings.AllowedImageContentTypes.Contains(contentType))
                    {
                        context.AddFailure("File", 
                            $"Image content type '{contentType}' is not allowed.");
                    }
                }
                else if (command.Type == PostType.Video)
                {
                    if (command.File.Length > _settings.MaxVideoSizeBytes)
                    {
                        context.AddFailure("File", 
                            $"Video size exceeds maximum allowed ({_settings.MaxVideoSizeBytes / 1024 / 1024}MB).");
                    }

                    if (!_settings.AllowedVideoExtensions.Contains(extension))
                    {
                        context.AddFailure("File", 
                            $"Video extension '{extension}' is not allowed. Allowed: {string.Join(", ", _settings.AllowedVideoExtensions)}");
                    }

                    if (!_settings.AllowedVideoContentTypes.Contains(contentType))
                    {
                        context.AddFailure("File", 
                            $"Video content type '{contentType}' is not allowed.");
                    }
                }
            });
    }
}
