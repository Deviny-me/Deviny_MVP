using Ignite.Domain.Entities;

namespace Ignite.Application.Common.Interfaces;

public interface IProgramRepository
{
    Task<TrainingProgram?> GetByIdAsync(Guid id);
    Task<TrainingProgram?> GetByIdPublicAsync(Guid id);
    Task<TrainingProgram?> GetByCodeAsync(string code);
    Task<List<TrainingProgram>> GetByTrainerIdAsync(Guid trainerId);
    Task<List<TrainingProgram>> GetAllPublicAsync();
    Task<TrainingProgram> CreateAsync(TrainingProgram program);
    Task UpdateAsync(TrainingProgram program);
    Task DeleteAsync(Guid id);
    Task<bool> IsCodeUniqueAsync(string code, Guid? excludeProgramId = null);
}
