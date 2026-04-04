using Deviny.Application.Common.Interfaces;
using MediatR;

namespace Deviny.Application.Features.Users.Commands;

public class DeleteAccountCommandHandler : IRequestHandler<DeleteAccountCommand, Unit>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;

    public DeleteAccountCommandHandler(IUserRepository userRepository, IPasswordHasher passwordHasher)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<Unit> Handle(DeleteAccountCommand request, CancellationToken ct)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId);

        if (user == null)
            throw new KeyNotFoundException("Пользователь не найден");

        if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            throw new ArgumentException("Неверный пароль");

        await _userRepository.DeleteAsync(request.UserId, ct);

        return Unit.Value;
    }
}
