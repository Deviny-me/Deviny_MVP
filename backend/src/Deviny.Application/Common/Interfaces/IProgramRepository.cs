using Deviny.Application.Features.Programs.DTOs;
using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

public interface IProgramRepository
{
    Task<TrainingProgram?> GetByIdAsync(Guid id);
    Task<TrainingProgram?> GetByIdPublicAsync(Guid id);
    Task<TrainingProgram?> GetByCodeAsync(string code);
    Task<List<TrainingProgram>> GetByTrainerIdAsync(Guid trainerId);
    Task<List<TrainingProgram>> GetAllPublicAsync();
    Task<List<ProgramWithStatsDto>> GetByTrainerIdWithStatsAsync(Guid trainerId);
    Task<List<ProgramWithStatsDto>> GetAllPublicWithStatsAsync();
    Task<(List<ProgramWithStatsDto> Items, int TotalCount)> GetAllPublicWithStatsPagedAsync(int page, int pageSize);
    Task<ProgramWithStatsDto?> GetByIdPublicWithStatsAsync(Guid id);
    Task<ProgramWithStatsDto?> GetByCodeWithStatsAsync(string code);
    Task<ProgramWithStatsDto?> GetStatsForProgramAsync(Guid programId);
    Task<TrainingProgram> CreateAsync(TrainingProgram program);
    Task UpdateAsync(TrainingProgram program);
    Task DeleteAsync(Guid id);
    Task<bool> IsCodeUniqueAsync(string code, Guid? excludeProgramId = null);
}
