using FluentValidation;
using Deviny.Application.Features.Posts.Commands;

namespace Deviny.Application.Features.Posts.Validators;

/// <summary>
/// FluentValidation validator for CreatePostCommentCommand.
/// </summary>
public class CreatePostCommentCommandValidator : AbstractValidator<CreatePostCommentCommand>
{
    public CreatePostCommentCommandValidator()
    {
        RuleFor(x => x.PostId)
            .NotEmpty()
            .WithMessage("Post ID is required.");

        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("User ID is required.");

        RuleFor(x => x.Content)
            .NotEmpty()
            .WithMessage("Comment content is required.")
            .MaximumLength(1000)
            .WithMessage("Comment cannot exceed 1000 characters.");
    }
}
