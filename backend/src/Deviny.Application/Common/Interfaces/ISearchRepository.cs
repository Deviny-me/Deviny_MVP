using Deviny.Application.DTOs.Search;

namespace Deviny.Application.Common.Interfaces;

public interface ISearchRepository
{
    Task<List<UserSearchItem>> SearchUsersAsync(string query, int limit, CancellationToken ct = default);
    Task<List<ProgramSearchItem>> SearchTrainingProgramsAsync(string query, int limit, CancellationToken ct = default);
    Task<List<ProgramSearchItem>> SearchMealProgramsAsync(string query, int limit, CancellationToken ct = default);
}
