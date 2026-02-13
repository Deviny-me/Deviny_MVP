using FluentValidation;
using Deviny.Application.Features.Posts.Commands;

namespace Deviny.Application.Features.Posts.Validators;

/// <summary>
/// FluentValidation validator for CreateRepostCommand.
/// </summary>
public class CreateRepostCommandValidator : AbstractValidator<CreateRepostCommand>
{
    public CreateRepostCommandValidator()
    {
        RuleFor(x => x.OriginalPostId)
            .NotEmpty()
            .WithMessage("Original post ID is required.");

        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("User ID is required.");

        RuleFor(x => x.Quote)
            .MaximumLength(280)
            .When(x => !string.IsNullOrEmpty(x.Quote))
            .WithMessage("Quote cannot exceed 280 characters.");
    }
}
