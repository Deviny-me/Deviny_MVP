using Deviny.API.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Deviny.Infrastructure.Persistence;
using Deviny.Domain.Enums;

namespace Deviny.API.Controllers;

[Route("api/trainer/me/[controller]")]
public class StudentsController : BaseApiController
{
    private readonly ApplicationDbContext _context;

    public StudentsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StudentDto>>> GetStudents()
    {
        try
        {
            var userId = GetCurrentUserId();

            // Verify the user is a trainer or nutritionist
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || (user.Role != UserRole.Trainer && user.Role != UserRole.Nutritionist))
            {
                return Forbid();
            }

            var students = await _context.Users
                .AsNoTracking()
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
        catch (Exception)
        {
            return StatusCode(500, new { message = "Error fetching students" });
        }
    }
}