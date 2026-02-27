using FluentValidation;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.DTOs;
using Deviny.Application.Features.Notifications.Events;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using MediatR;

namespace Deviny.Application.Features.Friends.Commands;

public class SendFriendRequestCommand : IRequest<FriendRequestDto>
{
    public Guid SenderId { get; set; }
    public Guid ReceiverId { get; set; }
}

public class SendFriendRequestCommandValidator : AbstractValidator<SendFriendRequestCommand>
{
    public SendFriendRequestCommandValidator()
    {
        RuleFor(x => x.SenderId).NotEmpty();
        RuleFor(x => x.ReceiverId).NotEmpty();
        RuleFor(x => x).Must(x => x.SenderId != x.ReceiverId)
            .WithMessage("Cannot send friend request to yourself");
    }
}

public class SendFriendRequestCommandHandler : IRequestHandler<SendFriendRequestCommand, FriendRequestDto>
{
    private readonly IFriendRequestRepository _friendRequestRepository;
    private readonly IUserBlockRepository _userBlockRepository;
    private readonly IUserRepository _userRepository;
    private readonly IMediator _mediator;

    public SendFriendRequestCommandHandler(
        IFriendRequestRepository friendRequestRepository,
        IUserBlockRepository userBlockRepository,
        IUserRepository userRepository,
        IMediator mediator)
    {
        _friendRequestRepository = friendRequestRepository;
        _userBlockRepository = userBlockRepository;
        _userRepository = userRepository;
        _mediator = mediator;
    }

    public async Task<FriendRequestDto> Handle(SendFriendRequestCommand request, CancellationToken cancellationToken)
    {
        // Check if users exist
        var sender = await _userRepository.GetByIdAsync(request.SenderId)
            ?? throw new Exception("Sender not found");
        var receiver = await _userRepository.GetByIdAsync(request.ReceiverId)
            ?? throw new Exception("Receiver not found");

        // Check for blocks
        var isBlocked = await _userBlockRepository.IsBlockedAsync(request.SenderId, request.ReceiverId);
        if (isBlocked)
            throw new Exception("Cannot send friend request due to block");

        // Check if already friends
        var areFriends = await _friendRequestRepository.AreFriendsAsync(request.SenderId, request.ReceiverId);
        if (areFriends)
            throw new Exception("Already friends");

        // Check for existing active request
        var existingRequest = await _friendRequestRepository.GetActiveRequestBetweenUsersAsync(request.SenderId, request.ReceiverId);
        if (existingRequest != null)
        {
            if (existingRequest.SenderId == request.SenderId)
                throw new Exception("Friend request already sent");

            // Auto-accept if reverse request exists
            existingRequest.Status = FriendRequestStatus.Accepted;
            existingRequest.RespondedAt = DateTime.UtcNow;
            await _friendRequestRepository.UpdateAsync(existingRequest);

            // Notify the original sender that their request was accepted
            await _mediator.Publish(new FriendRequestAcceptedEvent
            {
                RequestId = existingRequest.Id,
                AcceptorId = sender.Id,
                AcceptorName = sender.FullName,
                AcceptorAvatar = sender.AvatarUrl,
                OriginalSenderId = existingRequest.SenderId
            }, cancellationToken);

            return new FriendRequestDto
            {
                Id = existingRequest.Id,
                SenderId = existingRequest.SenderId,
                SenderEmail = existingRequest.Sender.Email,
                SenderFullName = existingRequest.Sender.FullName,
                SenderAvatar = existingRequest.Sender.AvatarUrl,
                SenderRole = existingRequest.Sender.Role.ToString(),
                ReceiverId = existingRequest.ReceiverId,
                ReceiverEmail = existingRequest.Receiver.Email,
                ReceiverFullName = existingRequest.Receiver.FullName,
                ReceiverAvatar = existingRequest.Receiver.AvatarUrl,
                ReceiverRole = existingRequest.Receiver.Role.ToString(),
                Status = existingRequest.Status,
                CreatedAt = existingRequest.CreatedAt,
                RespondedAt = existingRequest.RespondedAt
            };
        }

        // Create new request
        var friendRequest = new FriendRequest
        {
            SenderId = request.SenderId,
            ReceiverId = request.ReceiverId,
            Status = FriendRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _friendRequestRepository.AddAsync(friendRequest);

        // Publish real-time notification event
        await _mediator.Publish(new FriendRequestReceivedEvent
        {
            RequestId = friendRequest.Id,
            SenderId = sender.Id,
            SenderName = sender.FullName,
            SenderAvatar = sender.AvatarUrl,
            ReceiverId = receiver.Id
        }, cancellationToken);

        return new FriendRequestDto
        {
            Id = friendRequest.Id,
            SenderId = sender.Id,
            SenderEmail = sender.Email,
            SenderFullName = sender.FullName,
            SenderAvatar = sender.AvatarUrl,
            SenderRole = sender.Role.ToString(),
            ReceiverId = receiver.Id,
            ReceiverEmail = receiver.Email,
            ReceiverFullName = receiver.FullName,
            ReceiverAvatar = receiver.AvatarUrl,
            ReceiverRole = receiver.Role.ToString(),
            Status = friendRequest.Status,
            CreatedAt = friendRequest.CreatedAt,
            RespondedAt = friendRequest.RespondedAt
        };
    }
}
