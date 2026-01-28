using Ignite.Domain.Enums;

namespace Ignite.Domain.Entities;

public class VerificationDocument : BaseEntity
{
    public required Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public required string FileName { get; set; }
    public required string FilePath { get; set; }
    public required string FileType { get; set; }
    public required long FileSize { get; set; }
    
    public required VerificationStatus Status { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedByUserId { get; set; }
}
