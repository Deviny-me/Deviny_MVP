using FluentValidation;
using Ignite.Application.Features.Posts.DTOs;
using Ignite.Application.Features.Posts.Queries;

namespace Ignite.Application.Features.Posts.Validators;

public class GetMyPostsQueryValidator : AbstractValidator<GetMyPostsQuery>
{
    public GetMyPostsQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId is required.");

        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page must be >= 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("PageSize must be between 1 and 100.");

        RuleFor(x => x.Tab)
            .IsInEnum().WithMessage("Tab must be All (0), Videos (1), or Reposts (2).");
    }
}
