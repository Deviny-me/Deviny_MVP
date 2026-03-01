using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

public interface IFeedbackRepository
{
    Task<Feedback?> GetByIdAsync(int id);
    Task<Feedback> CreateAsync(Feedback feedback);
    Task<Feedback> UpdateAsync(Feedback feedback);
}
