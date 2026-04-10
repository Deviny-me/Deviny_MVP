using Deviny.Application.Common;
using Deviny.Application.Features.Programs.DTOs;
using MediatR;

namespace Deviny.Application.Features.Programs.Queries;

public record GetAllPublicProgramsQuery(
    int Page = 1,
    int PageSize = 20,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    double? MinRating = null,
    string? Tier = null,
    int? MinSales = null
) : IRequest<PagedResponse<PublicProgramDto>>;
