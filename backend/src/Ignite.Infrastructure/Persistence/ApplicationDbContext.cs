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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        
        // UserSettings configuration
        modelBuilder.Entity<UserSettings>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.HasIndex(e => e.UserId).IsUnique();
            
            entity.Property(e => e.Theme)
                .IsRequired()
                .HasMaxLength(10)
                .HasDefaultValue("light");
                
            entity.Property(e => e.Language)
                .HasMaxLength(10);
                
            entity.HasOne(e => e.User)
                .WithOne(u => u.Settings)
                .HasForeignKey<UserSettings>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
