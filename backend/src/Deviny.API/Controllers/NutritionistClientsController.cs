using Deviny.API.DTOs.Requests;
using Deviny.API.DTOs.Responses;
using Deviny.API.DTOs.Shared;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Deviny.Infrastructure.Persistence;
using Deviny.Domain.Enums;

namespace Deviny.API.Controllers;

[Route("api/nutritionist/me/clients")]
public class NutritionistClientsController : BaseApiController
{
    private readonly ApplicationDbContext _context;

    public NutritionistClientsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StudentDto>>> GetClients()
    {
        try
        {
            var userId = GetCurrentUserId();

            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || user.Role != UserRole.Nutritionist)
            {
                return Forbid();
            }

            var students = await _context.ProgramPurchases
                .AsNoTracking()
                .Where(pp =>
                    (pp.Status == ProgramPurchaseStatus.Active || pp.Status == ProgramPurchaseStatus.Completed) &&
                    pp.MealProgram != null &&
                    pp.MealProgram.TrainerId == userId &&
                    !pp.MealProgram.IsDeleted)
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
            return StatusCode(500, new { message = "Error fetching clients" });
        }
    }
}


