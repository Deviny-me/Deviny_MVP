using MediatR;

namespace Deviny.Application.Features.Users.Commands;

public record DeleteAccountCommand(Guid UserId, string Password) : IRequest<Unit>;
