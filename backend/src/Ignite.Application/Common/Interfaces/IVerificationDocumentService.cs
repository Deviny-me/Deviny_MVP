using Ignite.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace Ignite.Application.Common.Interfaces;

public interface IVerificationDocumentService
{
    Task<VerificationDocument> SaveVerificationDocumentAsync(
        Guid userId, 
        IFormFile file, 
        CancellationToken cancellationToken = default);
    
    Task<IEnumerable<VerificationDocument>> GetUserDocumentsAsync(Guid userId);
    
    Task<bool> ValidateFileAsync(IFormFile file);
}
