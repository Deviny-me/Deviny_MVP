using Deviny.API.DTOs.Requests;
using Deviny.API.DTOs.Responses;
using Deviny.API.DTOs.Shared;
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

            // Verify the user is a trainer
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || user.Role != UserRole.Trainer)
            {
                return Forbid();
            }

            var students = await _context.ProgramPurchases
                .AsNoTracking()
                .Where(pp =>
                    (pp.Status == ProgramPurchaseStatus.Active || pp.Status == ProgramPurchaseStatus.Completed) &&
                    (
                        (pp.TrainingProgram != null && pp.TrainingProgram.TrainerId == userId && !pp.TrainingProgram.IsDeleted) ||
                        (pp.MealProgram != null && pp.MealProgram.TrainerId == userId && !pp.MealProgram.IsDeleted)
                    ))
                .Select(pp => pp.User)
                .Distinct()
                .Where(u => u.IsActive)
                .Select(u => new StudentDto
                {
                    Id = u.Id,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    FullName = u.FirstName + " " + u.LastName,
                    Email = u.Email,
                    Phone = u.Phone,
                    AvatarUrl = u.AvatarUrl,
                    Role = u.Role.ToString()
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

