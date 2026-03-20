using Deviny.API.DTOs.Requests;
using Deviny.API.DTOs.Responses;
using Deviny.API.DTOs.Shared;
using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Enums;
using Deviny.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Deviny.API.Controllers;

[Route("api/[controller]")]
public class UserController : BaseApiController
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUserFollowRepository _userFollowRepository;
    private readonly IUserAchievementRepository _userAchievementRepository;
    private readonly IUserPostRepository _userPostRepository;
    private readonly ApplicationDbContext _context;
    private readonly IRealtimeNotifier _realtimeNotifier;

    public UserController(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IUserFollowRepository userFollowRepository,
        IUserAchievementRepository userAchievementRepository,
        IUserPostRepository userPostRepository,
        ApplicationDbContext context,
        IRealtimeNotifier realtimeNotifier)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _userFollowRepository = userFollowRepository;
        _userAchievementRepository = userAchievementRepository;
        _userPostRepository = userPostRepository;
        _context = context;
        _realtimeNotifier = realtimeNotifier;
    }

    [HttpGet("profile")]
    public async Task<ActionResult> GetProfile()
    {
        try
        {
            var userId = GetCurrentUserId();
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Fetch social stats — use count-only queries instead of loading entities
            var followingCount = await _userFollowRepository.GetFollowingCountAsync(userId);
            var followersCount = await _userFollowRepository.GetFollowerCountAsync(userId);
            var achievementsCount = await _userAchievementRepository.GetCountByUserIdAsync(userId);
            var postsCount = await _userPostRepository.GetCountByUserIdAsync(userId);

            return Ok(new
            {
                id = user.Id,
                firstName = user.FirstName,
                lastName = user.LastName,
                fullName = user.FullName,
                email = user.Email,
                phone = user.Phone ?? "",
                avatarUrl = user.AvatarUrl ?? "",
                bannerUrl = user.BannerUrl ?? "",
                theme = user.Settings?.Theme ?? "light",
                pushNotificationsEnabled = user.PushNotificationsEnabled,
                role = user.Role,
                country = user.Country,
                city = user.City,
                bio = user.Bio,
                gender = user.Gender?.ToString(),
                createdAt = user.CreatedAt,
                followingCount = followingCount,
                followersCount = followersCount,
                achievementsCount = achievementsCount,
                postsCount = postsCount
            });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Error getting profile" });
        }
    }

    [HttpPut("profile")]
    public async Task<ActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "Пользователь не найден" });
            }

            // Update user data
            if (!string.IsNullOrEmpty(request.FirstName))
                user.FirstName = request.FirstName;
            if (!string.IsNullOrEmpty(request.LastName))
                user.LastName = request.LastName;
            if (!string.IsNullOrEmpty(request.Phone))
                user.Phone = request.Phone;
            if (!string.IsNullOrEmpty(request.Theme) && user.Settings != null)
                user.Settings.Theme = request.Theme;
            if (request.PushNotificationsEnabled.HasValue)
                user.PushNotificationsEnabled = request.PushNotificationsEnabled.Value;
            if (!string.IsNullOrEmpty(request.Country))
                user.Country = request.Country;
            if (!string.IsNullOrEmpty(request.City))
                user.City = request.City;
            if (request.Bio != null)
                user.Bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();
            if (request.Gender != null)
            {
                if (string.IsNullOrWhiteSpace(request.Gender))
                {
                    user.Gender = null;
                }
                else if (Enum.TryParse<Deviny.Domain.Enums.Gender>(request.Gender, true, out var parsedGender))
                {
                    user.Gender = parsedGender;
                }
            }

            await _userRepository.UpdateAsync(user);

            await _realtimeNotifier.SendEntityChangedAsync(
                userId,
                "profile",
                "updated",
                "user-profile",
                user.Id,
                new { userId = user.Id });

            return Ok(new
            {
                message = "Профиль обновлен",
                user = new
                {
                    id = user.Id,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    fullName = user.FullName,
                    email = user.Email,
                    phone = user.Phone,
                    avatarUrl = user.AvatarUrl,
                    bannerUrl = user.BannerUrl,
                    theme = user.Settings?.Theme ?? "light",
                    pushNotificationsEnabled = user.PushNotificationsEnabled,
                    country = user.Country,
                    city = user.City,
                    bio = user.Bio,
                    gender = user.Gender?.ToString()
                }
            });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Ошибка при обновлении профиля" });
        }
    }

    [HttpPost("change-password")]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "Пользователь не найден" });
            }

            // Verify current password
            if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(new { message = "Неверный текущий пароль" });
            }

            // Hash and set new password
            user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            await _userRepository.UpdateAsync(user);

            return Ok(new { message = "Пароль успешно изменен" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Ошибка при смене пароля" });
        }
    }

    [HttpPost("avatar")]
    public async Task<ActionResult> UploadAvatar([FromForm] IFormFile file)
    {
        try
        {
            var userId = GetCurrentUserId();
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "Пользователь не найден" });
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Файл не выбран" });
            }

            // Validate file size (max 5MB)
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { message = "Размер файла не должен превышать 5 МБ" });
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var fileExtension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { message = "Допустимые форматы: JPG, JPEG, PNG, GIF" });
            }

            // Delete old avatar if exists
            if (!string.IsNullOrEmpty(user.AvatarUrl))
            {
                var oldAvatarPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", user.AvatarUrl.TrimStart('/'));
                if (System.IO.File.Exists(oldAvatarPath))
                {
                    System.IO.File.Delete(oldAvatarPath);
                }
            }

            // Generate unique filename
            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
            Directory.CreateDirectory(uploadPath);
            var filePath = Path.Combine(uploadPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Update user avatar URL
            var avatarUrl = $"/uploads/avatars/{fileName}";
            user.AvatarUrl = avatarUrl;
            await _userRepository.UpdateAsync(user);

            await _realtimeNotifier.SendEntityChangedAsync(
                userId,
                "profile",
                "updated",
                "user-profile",
                user.Id,
                new { userId = user.Id, avatarUrl });

            return Ok(new
            {
                message = "Аватар успешно загружен",
                avatarUrl = avatarUrl
            });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Ошибка при загрузке аватара" });
        }
    }

    [HttpDelete("avatar")]
    public async Task<ActionResult> DeleteAvatar()
    {
        try
        {
            var userId = GetCurrentUserId();
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "Пользователь не найден" });
            }

            if (string.IsNullOrEmpty(user.AvatarUrl))
            {
                return NotFound(new { message = "Аватар не найден" });
            }

            // Delete avatar file
            var avatarPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", user.AvatarUrl.TrimStart('/'));
            if (System.IO.File.Exists(avatarPath))
            {
                System.IO.File.Delete(avatarPath);
            }

            // Update user
            user.AvatarUrl = null;
            await _userRepository.UpdateAsync(user);

            await _realtimeNotifier.SendEntityChangedAsync(
                userId,
                "profile",
                "updated",
                "user-profile",
                user.Id,
                new { userId = user.Id, avatarUrl = (string?)null });

            return NoContent();
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Ошибка при удалении аватара" });
        }
    }

    [HttpPost("banner")]
    public async Task<ActionResult> UploadBanner([FromForm] IFormFile file)
    {
        try
        {
            var userId = GetCurrentUserId();
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "Пользователь не найден" });
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Файл не выбран" });
            }

            if (file.Length > 8 * 1024 * 1024)
            {
                return BadRequest(new { message = "Размер файла не должен превышать 8 МБ" });
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var fileExtension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { message = "Допустимые форматы: JPG, JPEG, PNG, GIF, WEBP" });
            }

            if (!string.IsNullOrEmpty(user.BannerUrl))
            {
                var oldBannerPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", user.BannerUrl.TrimStart('/'));
                if (System.IO.File.Exists(oldBannerPath))
                {
                    System.IO.File.Delete(oldBannerPath);
                }
            }

            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "banners");
            Directory.CreateDirectory(uploadPath);
            var filePath = Path.Combine(uploadPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var bannerUrl = $"/uploads/banners/{fileName}";
            user.BannerUrl = bannerUrl;
            await _userRepository.UpdateAsync(user);

            return Ok(new
            {
                message = "Баннер успешно загружен",
                bannerUrl = bannerUrl
            });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Ошибка при загрузке баннера" });
        }
    }

    [HttpDelete("banner")]
    public async Task<ActionResult> DeleteBanner()
    {
        try
        {
            var userId = GetCurrentUserId();
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "Пользователь не найден" });
            }

            if (string.IsNullOrEmpty(user.BannerUrl))
            {
                return NotFound(new { message = "Баннер не найден" });
            }

            var bannerPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", user.BannerUrl.TrimStart('/'));
            if (System.IO.File.Exists(bannerPath))
            {
                System.IO.File.Delete(bannerPath);
            }

            user.BannerUrl = null;
            await _userRepository.UpdateAsync(user);

            return NoContent();
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Ошибка при удалении баннера" });
        }
    }

    /// <summary>Get a public profile for any user by their ID.</summary>
    [HttpGet("/api/users/{userId:guid}/profile")]
    [AllowAnonymous]
    public async Task<ActionResult> GetPublicProfile(Guid userId)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var followingCount = await _userFollowRepository.GetFollowingCountAsync(userId);
            var followerCount = await _userFollowRepository.GetFollowerCountAsync(userId);
            var achievementsCount = await _userAchievementRepository.GetCountByUserIdAsync(userId);
            var postsCount = await _userPostRepository.GetPublicCountByUserIdAsync(userId);

            // Load expert profile data for trainers/nutritionists
            object? expertProfile = null;
            if (user.Role is UserRole.Trainer or UserRole.Nutritionist)
            {
                var trainerProfile = await _context.TrainerProfiles
                    .AsNoTracking()
                    .Include(p => p.Certificates.OrderBy(c => c.SortOrder))
                    .Include(p => p.Specializations)
                        .ThenInclude(ts => ts.Specialization)
                    .FirstOrDefaultAsync(p => p.UserId == userId);

                if (trainerProfile != null)
                {
                    expertProfile = new
                    {
                        primaryTitle = trainerProfile.PrimaryTitle,
                        secondaryTitle = trainerProfile.SecondaryTitle,
                        aboutText = trainerProfile.AboutText,
                        experienceYears = trainerProfile.ExperienceYears,
                        slug = trainerProfile.Slug,
                        programsCount = trainerProfile.ProgramsCount,
                        gender = user.Gender?.ToString()?.ToLower(),
                        phone = user.Phone,
                        specializations = trainerProfile.Specializations.Select(s => new
                        {
                            id = s.Specialization.Id,
                            name = s.Specialization.Name,
                        }).ToList(),
                        certificates = trainerProfile.Certificates.Select(c => new
                        {
                            id = c.Id,
                            title = c.Title,
                            issuer = c.Issuer,
                            year = c.Year,
                            fileUrl = c.FileUrl,
                            fileName = c.FileName,
                        }).ToList(),
                        ratingValue = 0.0,
                        reviewsCount = 0,
                    };
                }
            }

            return Ok(new
            {
                id = user.Id,
                firstName = user.FirstName,
                lastName = user.LastName,
                fullName = user.FullName,
                avatarUrl = user.AvatarUrl ?? "",
                bannerUrl = user.BannerUrl ?? "",
                role = user.Role,
                country = user.Country,
                city = user.City,
                bio = user.Bio,
                createdAt = user.CreatedAt,
                followingCount = followingCount,
                followersCount = followerCount,
                achievementsCount = achievementsCount,
                postsCount = postsCount,
                expertProfile = expertProfile,
            });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Error getting user profile" });
        }
    }
}


