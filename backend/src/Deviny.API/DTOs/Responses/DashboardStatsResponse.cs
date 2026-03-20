namespace Deviny.API.DTOs.Responses;

public class DashboardStatsResponse
{
    public int TotalStudents { get; set; }
    public int TotalProgramsSold { get; set; }
    public int TotalPrograms { get; set; }
    public List<MonthlySalesDto> MonthlySales { get; set; } = new();
    public List<ProgramStatsDto> ProgramStats { get; set; } = new();
    public TierDistributionDto TierDistribution { get; set; } = new();
    public List<RecentStudentDto> RecentStudents { get; set; } = new();
}

