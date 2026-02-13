namespace Deviny.Domain.Entities;

public class LevelDefinition
{
    public int Level { get; set; }
    public int RequiredXp { get; set; }
    public string? Title { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
