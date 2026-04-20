using FluentValidation;
using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using MediatR;

namespace Deviny.Application.Features.Messages.Commands;

/// <summary>
/// Send a message inside an existing conversation.
/// Used by both the REST endpoint and the ChatHub.
/// </summary>
public record SendMessageCommand(
    Guid SenderId,
    Guid ConversationId,
    string Text,
    Guid? ReplyToMessageId = null,
    string? AttachmentUrl = null,
    string? AttachmentFileName = null,
    string? AttachmentContentType = null,
    long? AttachmentSize = null) : IRequest<MessageDto>;

public class SendMessageCommandValidator : AbstractValidator<SendMessageCommand>
{
    public SendMessageCommandValidator()
    {
        RuleFor(x => x.ConversationId)
            .NotEmpty().WithMessage("Conversation ID is required");

        RuleFor(x => x.Text)
            .MaximumLength(2000).WithMessage("Message text must not exceed 2000 characters")
            .Must((cmd, text) => !string.IsNullOrWhiteSpace(text) || !string.IsNullOrEmpty(cmd.AttachmentUrl))
            .WithMessage("Message must contain text or an attachment");
    }
}

public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, MessageDto>
{
    private readonly IConversationRepository _conversationRepository;
    private readonly IMessageRepository _messageRepository;
    private readonly IAchievementService _achievementService;
    private readonly INotificationService _notificationService;

    public SendMessageCommandHandler(
        IConversationRepository conversationRepository,
        IMessageRepository messageRepository,
        IAchievementService achievementService,
        INotificationService notificationService)
    {
        _conversationRepository = conversationRepository;
        _messageRepository = messageRepository;
        _achievementService = achievementService;
        _notificationService = notificationService;
    }

    public async Task<MessageDto> Handle(SendMessageCommand request, CancellationToken cancellationToken)
    {
        // Verify membership
        var isMember = await _conversationRepository.IsMemberAsync(request.ConversationId, request.SenderId, cancellationToken);
        if (!isMember)
            throw new UnauthorizedAccessException("You are not a member of this conversation");

        // Create message
        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = request.ConversationId,
            SenderId = request.SenderId,
            Text = request.Text,
            ReplyToMessageId = request.ReplyToMessageId,
            AttachmentUrl = request.AttachmentUrl,
            AttachmentFileName = request.AttachmentFileName,
            AttachmentContentType = request.AttachmentContentType,
            AttachmentSize = request.AttachmentSize,
            CreatedAt = DateTime.UtcNow
        };

        message = await _messageRepository.AddAsync(message, cancellationToken);

        // Bump conversation UpdatedAt
        var conversation = await _conversationRepository.GetByIdAsync(request.ConversationId, cancellationToken);
        if (conversation != null)
        {
            conversation.UpdatedAt = DateTime.UtcNow;
            await _conversationRepository.UpdateAsync(conversation, cancellationToken);

            var receiverIds = conversation.Members
                .Select(m => m.UserId)
                .Where(id => id != request.SenderId)
                .Distinct()
                .ToList();

            if (receiverIds.Count > 0)
            {
                var previewText = string.IsNullOrWhiteSpace(request.Text)
                    ? "Sent you an attachment"
                    : request.Text.Trim();

                if (previewText.Length > 120)
                {
                    previewText = previewText[..120] + "...";
                }

                var senderName = conversation.Members
                    .FirstOrDefault(m => m.UserId == request.SenderId)
                    ?.User?.FullName
                    ?? "New message";

                await _notificationService.CreateForManyAsync(
                    receiverIds,
                    NotificationType.MessageReceived,
                    "New message",
                    $"{senderName}: {previewText}",
                    "Conversation",
                    conversation.Id,
                    cancellationToken);
            }
        }

        // Try to award achievement for first message sent
        try
        {
            await _achievementService.TryAwardAchievementAsync(
                request.SenderId,
                "FIRST_MESSAGE_SENT",
                AchievementSourceType.Message,
                message.Id,
                cancellationToken);

            // Nutritionist-specific achievement
            await _achievementService.TryAwardAchievementAsync(
                request.SenderId,
                "NUTRI_FIRST_MESSAGE",
                AchievementSourceType.Message,
                message.Id,
                cancellationToken);

            // User-specific achievement
            await _achievementService.TryAwardAchievementAsync(
                request.SenderId,
                "USER_FIRST_MESSAGE",
                AchievementSourceType.Message,
                message.Id,
                cancellationToken);
        }
        catch
        {
            // Silently ignore — message was already sent
        }

        return MapToDto(message);
    }

    internal static MessageDto MapToDto(Message message)
    {
        var dto = new MessageDto
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = message.SenderId,
            SenderName = message.Sender?.FullName ?? string.Empty,
            SenderAvatarUrl = message.Sender?.AvatarUrl,
            SenderRole = message.Sender?.Role.ToString(),
            Text = message.Text,
            AttachmentUrl = message.AttachmentUrl,
            AttachmentFileName = message.AttachmentFileName,
            AttachmentContentType = message.AttachmentContentType,
            AttachmentSize = message.AttachmentSize,
            CreatedAt = message.CreatedAt,
            ReadAt = message.ReadAt
        };

        if (message.ReplyToMessage != null)
        {
            dto.ReplyTo = new ReplyDto
            {
                Id = message.ReplyToMessage.Id,
                Text = message.ReplyToMessage.Text,
                SenderName = message.ReplyToMessage.Sender?.FullName ?? string.Empty
            };
        }

        return dto;
    }
}
