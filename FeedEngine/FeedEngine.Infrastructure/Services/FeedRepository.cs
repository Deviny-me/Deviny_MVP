using FeedEngine.Domain.Enums;
using FeedEngine.Domain.Models;
using FeedEngine.Domain.Services;
using FeedEngine.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FeedEngine.Infrastructure.Services;

public class FeedRepository : IFeedRepository
{
    private readonly FeedDbContext _db;

    public FeedRepository(FeedDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<PostFeedItem>> GetRecentPostsAsync(int limit, string? query, CancellationToken cancellationToken)
    {
        // Load most recent public posts, along with author info and engagement counts.
        var posts = from post in _db.UserPosts
                    where !post.IsDeleted && post.Visibility == PostVisibility.Public
                    join user in _db.Users on post.UserId equals user.Id
                    join like in _db.PostLikes on post.Id equals like.PostId into likes
                    join comment in _db.PostComments on post.Id equals comment.PostId into comments
                    join media in _db.PostMedia on post.Id equals media.PostId into medias
                    join repost in _db.UserPosts on post.Id equals repost.OriginalPostId into reposts
                    select new { post, user, likes, comments, medias, reposts };

        if (!string.IsNullOrWhiteSpace(query))
        {
            var normalized = query.Trim().ToLowerInvariant();
            posts = posts.Where(x =>
                (x.post.Caption != null && x.post.Caption.ToLower().Contains(normalized)) ||
                (x.user.Username != null && x.user.Username.ToLower().Contains(normalized)) ||
                (x.user.DisplayName != null && x.user.DisplayName.ToLower().Contains(normalized)));
        }

        var result = from x in posts
                     select new PostFeedItem
                     {
                         Id = x.post.Id,
                         CreatedAt = x.post.CreatedAt,
                         AuthorId = x.user.Id,
                         AuthorDisplayName = x.user.DisplayName ?? x.user.Username,
                         AuthorAvatarUrl = x.user.AvatarUrl,

                         ItemType = FeedItemType.Post,
                         PostType = x.post.Type,
                         Caption = x.post.Caption,
                         Visibility = x.post.Visibility,

                         LikeCount = x.likes.Count(),
                         CommentCount = x.comments.Count(),
                         RepostCount = x.reposts.Count(),
                         MediaUrl = x.medias.OrderBy(m => m.Order).Select(m => m.Url).FirstOrDefault()
                     };

        return await result
            .OrderByDescending(p => p.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AchievementFeedItem>> GetRecentAchievementsAsync(int limit, string? query, CancellationToken cancellationToken)
    {
        var q = from achievement in _db.Achievements
                where achievement.IsActive
                select new AchievementFeedItem
                {
                    Id = achievement.Id,
                    CreatedAt = achievement.CreatedAt,
                    AuthorId = Guid.Empty,
                    ItemType = FeedItemType.Achievement,
                    Title = achievement.Title,
                    Description = achievement.Description,
                    Points = achievement.XpReward
                };

        if (!string.IsNullOrWhiteSpace(query))
        {
            var normalized = query.Trim().ToLowerInvariant();
            q = q.Where(a =>
                (a.Title != null && a.Title.ToLower().Contains(normalized)) ||
                (a.Description != null && a.Description.ToLower().Contains(normalized)));
        }

        return await q
            .OrderByDescending(a => a.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ChallengeFeedItem>> GetRecentChallengesAsync(int limit, string? query, CancellationToken cancellationToken)
    {
        var q = from challenge in _db.Challenges
                where challenge.IsActive
                select new ChallengeFeedItem
                {
                    Id = challenge.Id,
                    CreatedAt = challenge.CreatedAt,
                    AuthorId = Guid.Empty,
                    ItemType = FeedItemType.Challenge,
                    Title = challenge.Title,
                    Description = challenge.Description,
                    EndsAt = null
                };

        if (!string.IsNullOrWhiteSpace(query))
        {
            var normalized = query.Trim().ToLowerInvariant();
            q = q.Where(c =>
                (c.Title != null && c.Title.ToLower().Contains(normalized)) ||
                (c.Description != null && c.Description.ToLower().Contains(normalized)));
        }

        return await q
            .OrderByDescending(c => c.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Guid>> GetFollowedUserIdsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var list = await _db.UserFollows
            .Where(f => f.FollowerId == userId)
            .Select(f => f.FolloweeId)
            .ToListAsync(cancellationToken);

        return list;
    }
}
