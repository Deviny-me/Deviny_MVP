namespace Deviny.API.DTOs.Responses;

public class ProgramStatsDto
{
    public Guid ProgramId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int TotalSales { get; set; }
    public int UniqueStudents { get; set; }
    public int BasicSales { get; set; }
    public int StandardSales { get; set; }
    public int ProSales { get; set; }
}

