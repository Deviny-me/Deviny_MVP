using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

public interface IFeedbackRepository
{
    Task<User?> GetByIdAsync(int id);
    Task<Feedback> CreateAsync(Feedback feedback);
    Task<Feedback> UpdateAsync(Feedback feedback);
}
