using Ignite.Application.Common.Interfaces;
using Ignite.Application.Common.Settings;
using Ignite.Infrastructure.Persistence;
using Ignite.Infrastructure.Repositories;
using Ignite.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ignite.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)
                      .EnableRetryOnFailure(
                          maxRetryCount: 10,
                          maxRetryDelay: TimeSpan.FromSeconds(30),
                          errorNumbersToAdd: new[] { -2, 4060, 40197, 40501, 40613, 49918, 49919, 49920 }))
            .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning)));
        
        // Configuration - IOptions pattern for strongly-typed settings
        services.Configure<FileStorageSettings>(
            configuration.GetSection(FileStorageSettings.SectionName));
        
        // Repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ITrainerProfileRepository, TrainerProfileRepository>();
        services.AddScoped<IProgramRepository, ProgramRepository>();
        services.AddScoped<IUserPostRepository, UserPostRepository>();
        services.AddScoped<IPostLikeRepository, PostLikeRepository>();
        services.AddScoped<IPostCommentRepository, PostCommentRepository>();
        services.AddScoped<IFriendRequestRepository, FriendRequestRepository>();
        services.AddScoped<IUserFollowRepository, UserFollowRepository>();
        services.AddScoped<IUserBlockRepository, UserBlockRepository>();
        services.AddScoped<IConversationRepository, ConversationRepository>();
        services.AddScoped<IMessageRepository, MessageRepository>();
        services.AddScoped<ISearchRepository, SearchRepository>();
        
        // Services
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<ILevelService, LevelService>();
        services.AddScoped<IVerificationDocumentService, VerificationDocumentService>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddSingleton<ISlugGenerator, SlugGenerator>();
        
        return services;
    }
}
