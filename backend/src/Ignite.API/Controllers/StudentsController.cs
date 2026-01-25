using Ignite.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ignite.Infrastructure.Persistence;
using Ignite.Domain.Enums;

namespace Ignite.API.Controllers;

[ApiController]
[Route("api/trainer/me/[controller]")]
[Authorize]
public class StudentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public StudentsController(ApplicationDbContext context)
    {
        _context = context;
    }

    private Guid GetTrainerId()
    {
        var userIdClaim = User.FindFirst("userId");
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            throw new UnauthorizedAccessException("Invalid user");
        return userId;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StudentDto>>> GetStudents()
    {
        try
        {
            var trainerId = GetTrainerId();

            // Для демонстрации возвращаем всех пользователей с ролью Student
            // В реальном приложении здесь должна быть связь между тренером и его студентами
            var students = await _context.Users
                .Where(u => u.Role == UserRole.Student && u.IsActive)
                .Select(u => new StudentDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Phone = u.Phone,
                    AvatarUrl = u.AvatarUrl
                })
                .ToListAsync();

            return Ok(students);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching students", error = ex.Message });
        }
    }
}
