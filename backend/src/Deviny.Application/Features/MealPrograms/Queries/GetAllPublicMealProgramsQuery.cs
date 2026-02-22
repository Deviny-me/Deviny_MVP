using Deviny.Application.Features.MealPrograms.DTOs;
using MediatR;

namespace Deviny.Application.Features.MealPrograms.Queries;

public record GetAllPublicMealProgramsQuery : IRequest<List<PublicMealProgramDto>>;
