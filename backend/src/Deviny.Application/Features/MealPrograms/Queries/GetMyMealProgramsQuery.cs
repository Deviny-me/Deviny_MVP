using Deviny.Application.Features.MealPrograms.DTOs;
using MediatR;

namespace Deviny.Application.Features.MealPrograms.Queries;

public class GetMyMealProgramsQuery : IRequest<List<MealProgramDto>>
{
    public Guid TrainerId { get; set; }
}
