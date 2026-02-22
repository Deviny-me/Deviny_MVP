using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

public interface IMealProgramRepository
{
    Task<MealProgram?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<MealProgram>> GetByTrainerIdAsync(Guid trainerId, CancellationToken ct = default);
    Task<List<MealProgram>> GetAllPublicAsync(CancellationToken ct = default);
    Task<MealProgram> CreateAsync(MealProgram program, CancellationToken ct = default);
    Task UpdateAsync(MealProgram program, CancellationToken ct = default);
    Task<bool> IsCodeUniqueAsync(string code, Guid? excludeId = null, CancellationToken ct = default);
}
