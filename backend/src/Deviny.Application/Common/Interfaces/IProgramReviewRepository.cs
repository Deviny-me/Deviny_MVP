using Deviny.Domain.Entities;
using Deviny.Domain.Enums;

namespace Deviny.Application.Common.Interfaces;

public interface IProgramReviewRepository
{
    Task<ProgramReview> CreateAsync(ProgramReview review);
    Task<List<ProgramReview>> GetByProgramAsync(Guid programId, ProgramType programType);
    Task<bool> ExistsAsync(Guid userId, Guid programId, ProgramType programType);
}
