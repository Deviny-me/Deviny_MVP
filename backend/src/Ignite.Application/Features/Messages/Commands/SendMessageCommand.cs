using FluentValidation;
using Ignite.Application.Common.Interfaces;
using Ignite.Domain.Entities;
using MediatR;

namespace Ignite.Application.Features.Messages.Commands;

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

    public SendMessageCommandHandler(
        IConversationRepository conversationRepository,
        IMessageRepository messageRepository)
    {
        _conversationRepository = conversationRepository;
        _messageRepository = messageRepository;
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
