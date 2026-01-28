using Ignite.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Ignite.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
    public DbSet<UserSettings> UserSettings { get; set; } = null!;
    public DbSet<TrainerProfile> TrainerProfiles { get; set; } = null!;
    public DbSet<TrainerCertificate> TrainerCertificates { get; set; } = null!;
    public DbSet<TrainerAchievement> TrainerAchievements { get; set; } = null!;
    public DbSet<Specialization> Specializations { get; set; } = null!;
    public DbSet<TrainerSpecialization> TrainerSpecializations { get; set; } = null!;
    public DbSet<ScheduleEvent> ScheduleEvents { get; set; } = null!;
    public DbSet<CallSession> CallSessions { get; set; } = null!;
    public DbSet<TrainingProgram> TrainingPrograms { get; set; } = null!;
    public DbSet<ProgramPurchase> ProgramPurchases { get; set; } = null!;
    public DbSet<ProgramReview> ProgramReviews { get; set; } = null!;
    
    // Level System
    public DbSet<UserLevel> UserLevels { get; set; } = null!;
    public DbSet<LevelDefinition> LevelDefinitions { get; set; } = null!;
    public DbSet<XpTransaction> XpTransactions { get; set; } = null!;
    
    // Verification
    public DbSet<VerificationDocument> VerificationDocuments { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
