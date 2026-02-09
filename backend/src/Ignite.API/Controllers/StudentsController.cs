using Ignite.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ignite.Infrastructure.Persistence;
using Ignite.Domain.Enums;
using System.Security.Claims;
using Ignite.Application.Common.Interfaces;

namespace Ignite.API.Controllers;

[Authorize]
[Route("api/trainer/me/[controller]")]
public class StudentsController : BaseApiController
{
    private readonly ApplicationDbContext _context;
    private readonly IUserRepository _userRepository;

    public StudentsController(ApplicationDbContext context, IUserRepository userRepository)
    {
        _context = context;
        _userRepository = userRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StudentDto>>> GetStudents()
    {
        try
        {
            // Get current user ID from claims
            var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(emailClaim))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var user = await _userRepository.GetByEmailAsync(emailClaim);
            if (user == null)
            {
                return Unauthorized(new { message = "User not found" });
            }

            // Для демонстрации возвращаем всех пользователей с ролью Student
            // В реальном приложении здесь должна быть связь между тренером и его студентами
            var students = await _context.Users
                .Where(u => u.Role == UserRole.Student && u.IsActive)
                .Select(u => new StudentDto
                {
                    Id = u.Id,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    FullName = u.FirstName + " " + u.LastName,
                    Email = u.Email,
                    Phone = u.Phone,
                    AvatarUrl = u.AvatarUrl
                })
                .ToListAsync();

            return Ok(students);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching students", error = ex.Message });
        }
    }
}