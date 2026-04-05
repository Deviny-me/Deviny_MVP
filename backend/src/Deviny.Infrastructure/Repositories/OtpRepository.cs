using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Repositories;

public class OtpRepository : IOtpRepository
{
    private readonly ApplicationDbContext _context;

    public OtpRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EmailOtp> CreateAsync(EmailOtp otp)
    {
        _context.EmailOtps.Add(otp);
        await _context.SaveChangesAsync();
        return otp;
    }

    public async Task<EmailOtp?> GetValidOtpAsync(string email, string purpose = "registration")
    {
        return await _context.EmailOtps
            .Where(o => o.Email.ToLower() == email.ToLower() 
                && o.Purpose == purpose
                && !o.IsUsed 
                && o.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<EmailOtp?> GetByEmailAndCodeAsync(string email, string code, string purpose = "registration")
    {
        return await _context.EmailOtps
            .Where(o => o.Email.ToLower() == email.ToLower() 
                && o.OtpCode == code
                && o.Purpose == purpose)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task MarkAsUsedAsync(Guid otpId)
    {
        var otp = await _context.EmailOtps.FindAsync(otpId);
        if (otp != null)
        {
            otp.IsUsed = true;
            otp.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task IncrementAttemptsAsync(Guid otpId)
    {
        var otp = await _context.EmailOtps.FindAsync(otpId);
        if (otp != null)
        {
            otp.Attempts++;
            otp.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task InvalidateAllForEmailAsync(string email, string purpose = "registration")
    {
        var otps = await _context.EmailOtps
            .Where(o => o.Email.ToLower() == email.ToLower() 
                && o.Purpose == purpose
                && !o.IsUsed)
            .ToListAsync();
        
        foreach (var otp in otps)
        {
            otp.IsUsed = true;
            otp.UpdatedAt = DateTime.UtcNow;
        }
        
        await _context.SaveChangesAsync();
    }

    public async Task<bool> IsEmailVerifiedAsync(string email, string purpose = "registration")
    {
        // Check if there's a used OTP for this email within the last hour
        var oneHourAgo = DateTime.UtcNow.AddHours(-1);
        return await _context.EmailOtps
            .AnyAsync(o => o.Email.ToLower() == email.ToLower() 
                && o.Purpose == purpose
                && o.IsUsed 
                && o.UpdatedAt >= oneHourAgo);
    }
}
