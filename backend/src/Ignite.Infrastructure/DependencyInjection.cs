using Ignite.Application.Common.Interfaces;
using Ignite.Infrastructure.Persistence;
using Ignite.Infrastructure.Repositories;
using Ignite.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
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
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));
        
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ITrainerProfileRepository, TrainerProfileRepository>();
        services.AddScoped<IProgramRepository, ProgramRepository>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddSingleton<SlugGenerator>();
        
        return services;
    }
}
