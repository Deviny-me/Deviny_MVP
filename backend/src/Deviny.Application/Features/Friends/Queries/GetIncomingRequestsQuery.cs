using FluentValidation;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.DTOs;
using MediatR;

namespace Deviny.Application.Features.Friends.Queries;

public class GetIncomingRequestsQuery : IRequest<List<FriendRequestDto>>
{
    public Guid UserId { get; set; }
}

public class GetIncomingRequestsQueryValidator : AbstractValidator<GetIncomingRequestsQuery>
{
    public GetIncomingRequestsQueryValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public class GetIncomingRequestsQueryHandler : IRequestHandler<GetIncomingRequestsQuery, List<FriendRequestDto>>
{
    private readonly IFriendRequestRepository _friendRequestRepository;

    public GetIncomingRequestsQueryHandler(IFriendRequestRepository friendRequestRepository)
    {
        _friendRequestRepository = friendRequestRepository;
    }

    public async Task<List<FriendRequestDto>> Handle(GetIncomingRequestsQuery request, CancellationToken cancellationToken)
    {
        var requests = await _friendRequestRepository.GetIncomingRequestsAsync(request.UserId);

        return requests.Select(r => new FriendRequestDto
        {
            Id = r.Id,
            SenderId = r.SenderId,
            SenderEmail = r.Sender.Email,
            SenderFullName = r.Sender.FullName,
            SenderAvatar = r.Sender.AvatarUrl,
            ReceiverId = r.ReceiverId,
            ReceiverEmail = r.Receiver.Email,
            ReceiverFullName = r.Receiver.FullName,
            ReceiverAvatar = r.Receiver.AvatarUrl,
            Status = r.Status,
            CreatedAt = r.CreatedAt,
            RespondedAt = r.RespondedAt
        }).ToList();
    }
}
