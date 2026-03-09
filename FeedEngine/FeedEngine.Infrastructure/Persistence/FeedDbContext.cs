using FeedEngine.Domain.Enums;
using FeedEngine.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace FeedEngine.Infrastructure.Persistence;

/// <summary>
/// EF Core context for reading feed-related data from the existing database.
/// </summary>
public class FeedDbContext : DbContext
{
    public FeedDbContext(DbContextOptions<FeedDbContext> options)
        : base(options)
    {
    }

    public DbSet<UserEntity> Users { get; set; } = null!;
    public DbSet<UserPostEntity> UserPosts { get; set; } = null!;
    public DbSet<PostMediaEntity> PostMedia { get; set; } = null!;
    public DbSet<PostLikeEntity> PostLikes { get; set; } = null!;
    public DbSet<PostCommentEntity> PostComments { get; set; } = null!;
    public DbSet<UserFollowEntity> UserFollows { get; set; } = null!;
    public DbSet<AchievementEntity> Achievements { get; set; } = null!;
    public DbSet<ChallengeEntity> Challenges { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserEntity>(builder =>
        {
            builder.ToTable("Users");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.Username).IsRequired();
            builder.Property(x => x.CreatedAt).IsRequired();
            builder.Property(x => x.UpdatedAt).IsRequired();
        });

        modelBuilder.Entity<UserPostEntity>(builder =>
        {
            builder.ToTable("UserPosts");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.CreatedAt).IsRequired();
            builder.Property(x => x.UpdatedAt).IsRequired();
            builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(x => x.Visibility).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(x => x.Caption).HasMaxLength(500);
        });

        modelBuilder.Entity<PostMediaEntity>(builder =>
        {
            builder.ToTable("PostMedia");
            builder.HasKey(x => x.Id);
        });

        modelBuilder.Entity<PostLikeEntity>(builder =>
        {
            builder.ToTable("PostLikes");
            builder.HasKey(x => x.Id);
        });

        modelBuilder.Entity<PostCommentEntity>(builder =>
        {
            builder.ToTable("PostComments");
            builder.HasKey(x => x.Id);
        });

        modelBuilder.Entity<UserFollowEntity>(builder =>
        {
            builder.ToTable("UserFollows");
            builder.HasKey(x => x.Id);
        });

        modelBuilder.Entity<AchievementEntity>(builder =>
        {
            builder.ToTable("Achievements");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.CreatedAt).IsRequired();
            builder.Property(x => x.UpdatedAt).IsRequired();
        });

        modelBuilder.Entity<ChallengeEntity>(builder =>
        {
            builder.ToTable("Challenges");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.CreatedAt).IsRequired();
            builder.Property(x => x.UpdatedAt).IsRequired();
        });
    }
}
