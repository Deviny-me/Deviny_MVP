using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

public interface ITrainerProfileRepository
{
    Task<TrainerProfile?> GetByUserIdAsync(Guid userId);
    Task<TrainerProfile?> GetByUserIdWithDetailsAsync(Guid userId);
    Task<List<TrainerProfile>> GetAllWithDetailsAsync();
    Task<(List<TrainerProfile> Items, int TotalCount)> GetAllWithDetailsPagedAsync(int page, int pageSize);
    Task<TrainerProfile> CreateAsync(TrainerProfile profile);
    Task<TrainerProfile> UpdateAsync(TrainerProfile profile);
    Task<bool> IsSlugUniqueAsync(string slug, Guid? excludeUserId = null);
}
