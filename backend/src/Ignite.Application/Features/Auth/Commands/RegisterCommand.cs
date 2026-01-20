using Ignite.Application.Features.Auth.DTOs;
using Ignite.Domain.Enums;
using MediatR;

namespace Ignite.Application.Features.Auth.Commands;

public record RegisterCommand(
    string FullName,
    string Email,
    string Password,
    UserRole Role
) : IRequest<LoginResponse>;
