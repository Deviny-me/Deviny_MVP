namespace Deviny.Domain.Entities;

public abstract class BaseEntity
{
    public required Guid Id { get; set; }
    public required DateTime CreatedAt { get; set; }
    public required DateTime UpdatedAt { get; set; }
}
