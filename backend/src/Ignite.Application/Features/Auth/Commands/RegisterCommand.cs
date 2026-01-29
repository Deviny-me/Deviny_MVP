using Ignite.Application.Features.Auth.DTOs;
using Ignite.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Ignite.Application.Features.Auth.Commands;

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
    IFormFile? VerificationDocument = null
) : IRequest<LoginResponse>;
