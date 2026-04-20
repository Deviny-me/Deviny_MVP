using FluentValidation;
using Deviny.Application.Features.Auth.DTOs;
using Deviny.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Deviny.Application.Features.Auth.Commands;

public record RegisterCommand(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    UserRole Role,
    // Extended fields for trainer registration
    string? Phone = null,
    Gender? Gender = null,
    string? Country = null,
    string? City = null,
    IFormFile? VerificationDocument = null,
    bool HasInjuries = false,
    IFormFile? InjuryDocument = null
) : IRequest<LoginResponse>;

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .MaximumLength(50).WithMessage("First name must not exceed 50 characters");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .MaximumLength(50).WithMessage("Last name must not exceed 50 characters");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format")
            .MaximumLength(100).WithMessage("Email must not exceed 100 characters");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters");

        RuleFor(x => x.Role)
            .IsInEnum().WithMessage("Invalid user role");

        // Trainer and Nutritionist specific validation
        When(x => x.Role == UserRole.Trainer || x.Role == UserRole.Nutritionist, () =>
        {
            RuleFor(x => x.Country)
                .NotEmpty().WithMessage("Country is required for trainers");

            RuleFor(x => x.City)
                .NotEmpty().WithMessage("City is required for trainers");

            RuleFor(x => x.Gender)
                .NotNull().WithMessage("Gender is required for trainers");
        });

        RuleFor(x => x.Phone)
            .MaximumLength(20).WithMessage("Phone number must not exceed 20 characters")
            .When(x => !string.IsNullOrEmpty(x.Phone));

        When(x => x.HasInjuries, () =>
        {
            RuleFor(x => x.InjuryDocument)
                .NotNull().WithMessage("Please upload your medical certificate to proceed");
        });
    }
}
