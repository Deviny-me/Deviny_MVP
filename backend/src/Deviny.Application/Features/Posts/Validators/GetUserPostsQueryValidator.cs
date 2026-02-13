using FluentValidation;
using Deviny.Application.Features.Posts.DTOs;
using Deviny.Application.Features.Posts.Queries;

namespace Deviny.Application.Features.Posts.Validators;

public class GetUserPostsQueryValidator : AbstractValidator<GetUserPostsQuery>
{
    public GetUserPostsQueryValidator()
    {
        RuleFor(x => x.TargetUserId)
            .NotEmpty().WithMessage("TargetUserId is required.");

        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page must be >= 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("PageSize must be between 1 and 100.");

        RuleFor(x => x.Tab)
            .IsInEnum().WithMessage("Tab must be All (0), Videos (1), or Reposts (2).");
    }
}
