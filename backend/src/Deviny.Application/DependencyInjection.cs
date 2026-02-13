using FluentValidation;
using Deviny.Application.Common.Behaviors;
using Deviny.Application.Features.Auth.Commands;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace Deviny.Application;

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
