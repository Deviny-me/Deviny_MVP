using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _context.Users.FindAsync(id);
    }

    public async Task<User?> GetBySlugAsync(string slug)
    {
        var normalized = slug.Trim().ToLowerInvariant();
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Slug != null && u.Slug.ToLower() == normalized);
    }

    public async Task<bool> IsSlugUniqueAsync(string slug, Guid? excludeUserId = null)
    {
        var normalized = slug.Trim().ToLowerInvariant();
        return !await _context.Users
            .AnyAsync(u => u.Slug != null && u.Slug.ToLower() == normalized && (!excludeUserId.HasValue || u.Id != excludeUserId.Value));
    }

    public async Task<User> CreateAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User> UpdateAsync(User user)
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task DeleteAsync(Guid userId, CancellationToken ct = default)
    {
        var strategy = _context.Database.CreateExecutionStrategy();

        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(ct);
            try
            {
                // 1. Обнулить GymBroId в профилях других тренеров, которые ссылаются
                //    на удаляемого пользователя (FK с OnDelete: NoAction).
                await _context.TrainerProfiles
                    .Where(tp => tp.GymBroId == userId)
                    .ExecuteUpdateAsync(s => s.SetProperty(tp => tp.GymBroId, (Guid?)null), ct);

                // 2. Снять ссылки репостов чужих пользователей на посты удаляемого
                var ownPostIds = await _context.UserPosts
                    .Where(p => p.UserId == userId)
                    .Select(p => p.Id)
                    .ToListAsync(ct);

                if (ownPostIds.Count > 0)
                {
                    await _context.UserPosts
                        .Where(p => p.OriginalPostId.HasValue && ownPostIds.Contains(p.OriginalPostId!.Value))
                        .ExecuteUpdateAsync(s => s.SetProperty(p => p.OriginalPostId, (Guid?)null), ct);
                }

                // 3. Снять ссылки ответов на комментарии удаляемого пользователя
                var ownCommentIds = await _context.PostComments
                    .Where(c => c.UserId == userId)
                    .Select(c => c.Id)
                    .ToListAsync(ct);

                if (ownCommentIds.Count > 0)
                {
                    await _context.PostComments
                        .Where(c => c.ParentCommentId.HasValue && ownCommentIds.Contains(c.ParentCommentId!.Value))
                        .ExecuteUpdateAsync(s => s.SetProperty(c => c.ParentCommentId, (Guid?)null), ct);
                }

                // 4. Снять ссылки ReplyToMessageId на сообщения удаляемого пользователя
                var ownMessageIds = await _context.Messages
                    .Where(m => m.SenderId == userId)
                    .Select(m => m.Id)
                    .ToListAsync(ct);

                if (ownMessageIds.Count > 0)
                {
                    await _context.Messages
                        .Where(m => m.ReplyToMessageId.HasValue && ownMessageIds.Contains(m.ReplyToMessageId!.Value))
                        .ExecuteUpdateAsync(s => s.SetProperty(m => m.ReplyToMessageId, (Guid?)null), ct);
                }

                // 5. Удалить комментарии пользователя (к чужим постам)
                await _context.PostComments
                    .Where(c => c.UserId == userId)
                    .ExecuteDeleteAsync(ct);

                // 6. Удалить лайки пользователя (к чужим постам)
                await _context.PostLikes
                    .Where(l => l.UserId == userId)
                    .ExecuteDeleteAsync(ct);

                // 7. Удалить сообщения пользователя
                await _context.Messages
                    .Where(m => m.SenderId == userId)
                    .ExecuteDeleteAsync(ct);

                // 8. Удалить заявки в друзья (входящие и исходящие)
                await _context.FriendRequests
                    .Where(fr => fr.SenderId == userId || fr.ReceiverId == userId)
                    .ExecuteDeleteAsync(ct);

                // 9. Удалить подписки (как подписчик и как тренер)
                await _context.UserFollows
                    .Where(uf => uf.FollowerId == userId || uf.TrainerId == userId)
                    .ExecuteDeleteAsync(ct);

                // 10. Удалить блокировки (обе стороны)
                await _context.UserBlocks
                    .Where(ub => ub.BlockerId == userId || ub.BlockedUserId == userId)
                    .ExecuteDeleteAsync(ct);

                // 11. Удалить собственные отзывы пользователя на чужие программы
                await _context.ProgramReviews
                    .Where(pr => pr.UserId == userId)
                    .ExecuteDeleteAsync(ct);

                // 12. Удалить покупки программ пользователем
                await _context.ProgramPurchases
                    .Where(pp => pp.UserId == userId)
                    .ExecuteDeleteAsync(ct);

                // 13. Удалить тренировочные программы (тренер/нутрициолог).
                //     IgnoreQueryFilters — включить soft-deleted.
                //     БД каскадно удалит покупки и отзывы ДРУГИХ пользователей на эти программы.
                await _context.TrainingPrograms
                    .IgnoreQueryFilters()
                    .Where(p => p.TrainerId == userId)
                    .ExecuteDeleteAsync(ct);

                // 14. Удалить программы питания (нутрициолог/тренер).
                await _context.MealPrograms
                    .IgnoreQueryFilters()
                    .Where(p => p.TrainerId == userId)
                    .ExecuteDeleteAsync(ct);

                // 15. Удалить события расписания (как тренер).
                //     БД каскадно удалит связанные CallSessions через EventId (Cascade).
                await _context.ScheduleEvents
                    .Where(se => se.TrainerId == userId)
                    .ExecuteDeleteAsync(ct);

                // 16. Удалить оставшиеся сессии звонков (тренер без события).
                await _context.CallSessions
                    .Where(cs => cs.TrainerId == userId)
                    .ExecuteDeleteAsync(ct);

                // 17. Удалить пользователя. БД каскадно удалит:
                //     RefreshTokens, UserSettings, ConversationMembers, UserAchievements,
                //     TrainerProfile (→ Certificates, Specializations, VerificationDocuments),
                //     Notifications, XpTransactions, UserLevel, UserChallengeProgress, Feedback,
                //     UserPosts (→ PostMedia, PostLikes, PostComments на постах).
                await _context.Users
                    .Where(u => u.Id == userId)
                    .ExecuteDeleteAsync(ct);

                await transaction.CommitAsync(ct);
            }
            catch
            {
                await transaction.RollbackAsync(ct);
                throw;
            }
        });
    }

    public async Task<RefreshToken> AddRefreshTokenAsync(RefreshToken token)
    {
        _context.RefreshTokens.Add(token);
        await _context.SaveChangesAsync();
        return token;
    }

    public async Task<RefreshToken?> GetRefreshTokenAsync(string token)
    {
        return await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == token && rt.RevokedAt == null);
    }

    public async Task RevokeRefreshTokenAsync(string token)
    {
        var refreshToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == token);
        
        if (refreshToken != null)
        {
            refreshToken.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }
}
