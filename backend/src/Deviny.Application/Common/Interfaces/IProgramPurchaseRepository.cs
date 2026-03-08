using Deviny.Domain.Entities;
using Deviny.Domain.Enums;

namespace Deviny.Application.Common.Interfaces;

public interface IProgramPurchaseRepository
{
    Task<ProgramPurchase> CreateAsync(ProgramPurchase purchase);
    Task<List<ProgramPurchase>> GetByUserIdAsync(Guid userId);
    Task<bool> ExistsAsync(Guid userId, Guid programId, ProgramType programType, ProgramTier tier);
    Task<int> CountByProgramAndTierAsync(Guid programId, ProgramType programType, ProgramTier tier);
    Task<bool> HasCompletedPurchaseAsync(Guid userId, Guid programId, ProgramType programType);
}
