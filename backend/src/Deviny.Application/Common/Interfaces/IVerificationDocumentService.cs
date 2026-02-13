using Deviny.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace Deviny.Application.Common.Interfaces;

public interface IVerificationDocumentService
{
    Task<VerificationDocument> SaveVerificationDocumentAsync(
        Guid userId, 
        IFormFile file, 
        CancellationToken cancellationToken = default);
    
    Task<IEnumerable<VerificationDocument>> GetUserDocumentsAsync(Guid userId);
    
    Task<bool> ValidateFileAsync(IFormFile file);
}
