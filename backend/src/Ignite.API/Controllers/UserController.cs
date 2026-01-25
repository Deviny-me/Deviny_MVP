using Ignite.API.DTOs;
using Ignite.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace Ignite.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IConfiguration _configuration;

    public UserController(IUserRepository userRepository, IPasswordHasher passwordHasher, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
    }

    [HttpGet("profile")]
    public async Task<ActionResult> GetProfile()
    {
        try
        {
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return Unauthorized(new { message = "Требуется авторизация" });
            }

            var token = authHeader.Substring("Bearer ".Length).Trim();
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);
            
            var emailClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "email" || c.Type == ClaimTypes.Email);
            if (emailClaim == null)
            {
                return Unauthorized(new { message = "Неверный токен" });
            }

            var user = await _userRepository.GetByEmailAsync(emailClaim.Value);
            if (user == null)
            {
                return NotFound(new { message = "Пользователь не найден" });
            }

            return Ok(new
            {
                id = user.Id,
                name = user.Name,
                email = user.Email,
                phone = user.Phone ?? "",
                avatarUrl = user.AvatarUrl ?? "",
                theme = user.Theme ?? "light",
                pushNotificationsEnabled = user.PushNotificationsEnabled,
                role = user.Role
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Ошибка при получении профиля", error = ex.Message });
        }
    }

    [HttpPut("profile")]
    public async Task<ActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        try
        {
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return Unauthorized(new { message = "Требуется авторизация" });
            }

            var token = authHeader.Substring("Bearer ".Length).Trim();
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);
            
            var emailClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "email" || c.Type == ClaimTypes.Email);
            if (emailClaim == null)
            {
                return Unauthorized(new { message = "Неверный токен" });
            }

            var user = await _userRepository.GetByEmailAsync(emailClaim.Value);
            if (user == null)
            {
                return NotFound(new { message = "Пользователь не найден" });
            }

            // Update user data
            if (!string.IsNullOrEmpty(request.Name))
                user.Name = request.Name;
            if (!string.IsNullOrEmpty(request.Phone))
                user.Phone = request.Phone;
            if (!string.IsNullOrEmpty(request.Theme))
                user.Theme = request.Theme;
            if (request.PushNotificationsEnabled.HasValue)
                user.PushNotificationsEnabled = request.PushNotificationsEnabled.Value;

            await _userRepository.UpdateAsync(user);

            return Ok(new
            {
                message = "Профиль обновлен",
                user = new
                {
                    id = user.Id,
                    name = user.Name,
                    email = user.Email,
                    phone = user.Phone,
                    avatarUrl = user.AvatarUrl,
                    theme = user.Theme,
                    pushNotificationsEnabled = user.PushNotificationsEnabled
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Ошибка при обновлении профиля", error = ex.Message });
        }
    }

    [HttpPost("change-password")]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return Unauthorized(new { message = "Требуется авторизация" });
            }

            var token = authHeader.Substring("Bearer ".Length).Trim();
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);
            
            var emailClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "email" || c.Type == ClaimTypes.Email);
            if (emailClaim == null)
            {
                return Unauthorized(new { message = "Неверный токен" });
            }

            var user = await _userRepository.GetByEmailAsync(emailClaim.Value);
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
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Ошибка при смене пароля", error = ex.Message });
        }
    }

    [HttpPost("avatar")]
    public async Task<ActionResult> UploadAvatar([FromForm] IFormFile file)
    {
        try
        {
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return Unauthorized(new { message = "Требуется авторизация" });
            }

            var token = authHeader.Substring("Bearer ".Length).Trim();
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);
            
            var emailClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "email" || c.Type == ClaimTypes.Email);
            if (emailClaim == null)
            {
                return Unauthorized(new { message = "Неверный токен" });
            }

            var user = await _userRepository.GetByEmailAsync(emailClaim.Value);
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

            return Ok(new
            {
                message = "Аватар успешно загружен",
                avatarUrl = avatarUrl
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Ошибка при загрузке аватара", error = ex.Message });
        }
    }

    [HttpDelete("avatar")]
    public async Task<ActionResult> DeleteAvatar()
    {
        try
        {
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return Unauthorized(new { message = "Требуется авторизация" });
            }

            var token = authHeader.Substring("Bearer ".Length).Trim();
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);
            
            var emailClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "email" || c.Type == ClaimTypes.Email);
            if (emailClaim == null)
            {
                return Unauthorized(new { message = "Неверный токен" });
            }

            var user = await _userRepository.GetByEmailAsync(emailClaim.Value);
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

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Ошибка при удалении аватара", error = ex.Message });
        }
    }
}
