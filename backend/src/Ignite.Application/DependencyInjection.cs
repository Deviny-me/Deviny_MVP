using FluentValidation;
using Ignite.Application.Common.Behaviors;
using Ignite.Application.Features.Auth.Commands;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace Ignite.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<LoginCommandHandler>();
        
        // Регистрация MediatR
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
        
        // Регистрация FluentValidation - все валидаторы из текущей сборки
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        
        // Регистрация ValidationBehavior pipeline для автоматической валидации
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        
        return services;
    }
}
