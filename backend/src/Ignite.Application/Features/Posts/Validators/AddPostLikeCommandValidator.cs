using FluentValidation;
using Ignite.Application.Features.Posts.Commands;

namespace Ignite.Application.Features.Posts.Validators;

/// <summary>
/// FluentValidation validator for AddPostLikeCommand.
/// </summary>
public class AddPostLikeCommandValidator : AbstractValidator<AddPostLikeCommand>
{
    public AddPostLikeCommandValidator()
    {
        RuleFor(x => x.PostId)
            .NotEmpty()
            .WithMessage("Post ID is required.");

        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("User ID is required.");
    }
}
