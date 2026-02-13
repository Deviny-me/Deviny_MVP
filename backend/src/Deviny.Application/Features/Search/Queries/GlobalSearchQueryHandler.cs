using Deviny.Application.Common.Interfaces;
using Deviny.Application.DTOs.Search;
using MediatR;

namespace Deviny.Application.Features.Search.Queries;

public class GlobalSearchQueryHandler : IRequestHandler<GlobalSearchQuery, GlobalSearchResponse>
{
    private readonly ISearchRepository _searchRepository;

    public GlobalSearchQueryHandler(ISearchRepository searchRepository)
    {
        _searchRepository = searchRepository;
    }

    public async Task<GlobalSearchResponse> Handle(GlobalSearchQuery request, CancellationToken cancellationToken)
    {
        var normalizedQuery = request.Query.Trim();
        var limit = request.Limit;

        // Run sequentially — EF Core DbContext is not thread-safe
        var users = await _searchRepository.SearchUsersAsync(normalizedQuery, limit, cancellationToken);
        var workoutPrograms = await _searchRepository.SearchTrainingProgramsAsync(normalizedQuery, limit, cancellationToken);
        var mealPrograms = await _searchRepository.SearchMealProgramsAsync(normalizedQuery, limit, cancellationToken);

        return new GlobalSearchResponse
        {
            Users = users,
            WorkoutPrograms = workoutPrograms,
            MealPrograms = mealPrograms
        };
    }
}
