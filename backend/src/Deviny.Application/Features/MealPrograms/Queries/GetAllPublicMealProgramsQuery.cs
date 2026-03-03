using Deviny.Application.Common;
using Deviny.Application.Features.MealPrograms.DTOs;
using MediatR;

namespace Deviny.Application.Features.MealPrograms.Queries;

public record GetAllPublicMealProgramsQuery(int Page = 1, int PageSize = 20) : IRequest<PagedResponse<PublicMealProgramDto>>;
