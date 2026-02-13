using FluentValidation;
using Deviny.Application.Common.Interfaces;
using MediatR;

namespace Deviny.Application.Features.Friends.Commands;

public class UnblockUserCommand : IRequest<Unit>
{
    public Guid BlockerId { get; set; }
    public Guid BlockedUserId { get; set; }
}

public class UnblockUserCommandValidator : AbstractValidator<UnblockUserCommand>
{
    public UnblockUserCommandValidator()
    {
        RuleFor(x => x.BlockerId).NotEmpty();
        RuleFor(x => x.BlockedUserId).NotEmpty();
    }
}

public class UnblockUserCommandHandler : IRequestHandler<UnblockUserCommand, Unit>
{
    private readonly IUserBlockRepository _userBlockRepository;

    public UnblockUserCommandHandler(IUserBlockRepository userBlockRepository)
    {
        _userBlockRepository = userBlockRepository;
    }

    public async Task<Unit> Handle(UnblockUserCommand request, CancellationToken cancellationToken)
    {
        var userBlock = await _userBlockRepository.GetBlockAsync(request.BlockerId, request.BlockedUserId)
            ?? throw new Exception("Not blocked");

        await _userBlockRepository.DeleteAsync(userBlock);

        return Unit.Value;
    }
}
