using FluentValidation;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.DTOs;
using MediatR;

namespace Deviny.Application.Features.Friends.Queries;

public class GetOutgoingRequestsQuery : IRequest<List<FriendRequestDto>>
{
    public Guid UserId { get; set; }
}

public class GetOutgoingRequestsQueryValidator : AbstractValidator<GetOutgoingRequestsQuery>
{
    public GetOutgoingRequestsQueryValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public class GetOutgoingRequestsQueryHandler : IRequestHandler<GetOutgoingRequestsQuery, List<FriendRequestDto>>
{
    private readonly IFriendRequestRepository _friendRequestRepository;

    public GetOutgoingRequestsQueryHandler(IFriendRequestRepository friendRequestRepository)
    {
        _friendRequestRepository = friendRequestRepository;
    }

    public async Task<List<FriendRequestDto>> Handle(GetOutgoingRequestsQuery request, CancellationToken cancellationToken)
    {
        var requests = await _friendRequestRepository.GetOutgoingRequestsAsync(request.UserId);

        return requests.Select(r => new FriendRequestDto
        {
            Id = r.Id,
            SenderId = r.SenderId,
            SenderEmail = r.Sender.Email,
            SenderFullName = r.Sender.FullName,
            SenderAvatar = r.Sender.AvatarUrl,
            SenderRole = r.Sender.Role.ToString(),
            ReceiverId = r.ReceiverId,
            ReceiverEmail = r.Receiver.Email,
            ReceiverFullName = r.Receiver.FullName,
            ReceiverAvatar = r.Receiver.AvatarUrl,
            ReceiverRole = r.Receiver.Role.ToString(),
            Status = r.Status,
            CreatedAt = r.CreatedAt,
            RespondedAt = r.RespondedAt
        }).ToList();
    }
}
