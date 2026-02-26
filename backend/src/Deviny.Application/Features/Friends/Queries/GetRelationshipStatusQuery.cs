using FluentValidation;
using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Enums;
using MediatR;

namespace Deviny.Application.Features.Friends.Queries;

public class RelationshipStatusDto
{
    public bool IsFriend { get; set; }
    public DateTime? FriendsSince { get; set; }
    public bool HasPendingRequest { get; set; }
    public int? PendingRequestId { get; set; }
    public bool IsRequestSender { get; set; }
    public bool IsFollowing { get; set; }
    public bool IsBlocked { get; set; }
    public bool IsBlockedByThem { get; set; }
}

public class GetRelationshipStatusQuery : IRequest<RelationshipStatusDto>
{
    public Guid CurrentUserId { get; set; }
    public Guid TargetUserId { get; set; }
}

public class GetRelationshipStatusQueryValidator : AbstractValidator<GetRelationshipStatusQuery>
{
    public GetRelationshipStatusQueryValidator()
    {
        RuleFor(x => x.CurrentUserId).NotEmpty();
        RuleFor(x => x.TargetUserId).NotEmpty();
        RuleFor(x => x.TargetUserId).NotEqual(x => x.CurrentUserId)
            .WithMessage("Cannot check relationship with yourself.");
    }
}

public class GetRelationshipStatusQueryHandler : IRequestHandler<GetRelationshipStatusQuery, RelationshipStatusDto>
{
    private readonly IFriendRequestRepository _friendRequestRepository;
    private readonly IUserFollowRepository _userFollowRepository;
    private readonly IUserBlockRepository _userBlockRepository;

    public GetRelationshipStatusQueryHandler(
        IFriendRequestRepository friendRequestRepository,
        IUserFollowRepository userFollowRepository,
        IUserBlockRepository userBlockRepository)
    {
        _friendRequestRepository = friendRequestRepository;
        _userFollowRepository = userFollowRepository;
        _userBlockRepository = userBlockRepository;
    }

    public async Task<RelationshipStatusDto> Handle(GetRelationshipStatusQuery request, CancellationToken cancellationToken)
    {
        var dto = new RelationshipStatusDto();

        // Check friendship
        var isFriend = await _friendRequestRepository.AreFriendsAsync(request.CurrentUserId, request.TargetUserId);
        dto.IsFriend = isFriend;

        if (isFriend)
        {
            var friends = await _friendRequestRepository.GetFriendsAsync(request.CurrentUserId);
            var friendship = friends.FirstOrDefault(f => f.Friend.Id == request.TargetUserId);
            if (friendship.Friend != null)
            {
                dto.FriendsSince = friendship.FriendsSince;
            }
        }

        // Check pending request
        if (!isFriend)
        {
            var pendingRequest = await _friendRequestRepository.GetActiveRequestBetweenUsersAsync(
                request.CurrentUserId, request.TargetUserId);

            if (pendingRequest != null && pendingRequest.Status == FriendRequestStatus.Pending)
            {
                dto.HasPendingRequest = true;
                dto.PendingRequestId = pendingRequest.Id;
                dto.IsRequestSender = pendingRequest.SenderId == request.CurrentUserId;
            }
        }

        // Check follow
        var follow = await _userFollowRepository.GetFollowAsync(request.CurrentUserId, request.TargetUserId);
        dto.IsFollowing = follow != null;

        // Check blocks
        var block = await _userBlockRepository.GetBlockAsync(request.CurrentUserId, request.TargetUserId);
        dto.IsBlocked = block != null;

        var reverseBlock = await _userBlockRepository.GetBlockAsync(request.TargetUserId, request.CurrentUserId);
        dto.IsBlockedByThem = reverseBlock != null;

        return dto;
    }
}
