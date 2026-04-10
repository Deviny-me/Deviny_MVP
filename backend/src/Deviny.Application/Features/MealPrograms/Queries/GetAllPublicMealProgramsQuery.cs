using Deviny.Application.Common;
using Deviny.Application.Features.MealPrograms.DTOs;
using MediatR;

namespace Deviny.Application.Features.MealPrograms.Queries;

public record GetAllPublicMealProgramsQuery(
    int Page = 1,
    int PageSize = 20,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    double? MinRating = null,
    string? Tier = null,
    int? MinSales = null
) : IRequest<PagedResponse<PublicMealProgramDto>>;
