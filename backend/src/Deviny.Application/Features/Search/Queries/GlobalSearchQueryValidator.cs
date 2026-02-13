using FluentValidation;

namespace Deviny.Application.Features.Search.Queries;

public class GlobalSearchQueryValidator : AbstractValidator<GlobalSearchQuery>
{
    public GlobalSearchQueryValidator()
    {
        RuleFor(x => x.Query)
            .NotEmpty().WithMessage("Search query is required.")
            .MinimumLength(2).WithMessage("Search query must be at least 2 characters.")
            .MaximumLength(64).WithMessage("Search query must not exceed 64 characters.");

        RuleFor(x => x.Limit)
            .InclusiveBetween(1, 20).WithMessage("Limit must be between 1 and 20.");
    }
}
