using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using MediatR;

namespace Deviny.Application.Features.Purchases.Commands;

public class PurchaseProgramCommandHandler : IRequestHandler<PurchaseProgramCommand, PurchaseProgramResult>
{
    private readonly IProgramPurchaseRepository _purchaseRepository;
    private readonly IProgramRepository _programRepository;
    private readonly IMealProgramRepository _mealProgramRepository;

    public PurchaseProgramCommandHandler(
        IProgramPurchaseRepository purchaseRepository,
        IProgramRepository programRepository,
        IMealProgramRepository mealProgramRepository)
    {
        _purchaseRepository = purchaseRepository;
        _programRepository = programRepository;
        _mealProgramRepository = mealProgramRepository;
    }

    public async Task<PurchaseProgramResult> Handle(PurchaseProgramCommand request, CancellationToken cancellationToken)
    {
        // 1. Parse and validate input
        if (!Enum.TryParse<ProgramType>(request.ProgramType, ignoreCase: true, out var programType))
            return PurchaseProgramResult.Fail("Invalid program type. Must be 'training' or 'meal'.");

        if (!Enum.TryParse<ProgramTier>(request.Tier, ignoreCase: true, out var tier))
            return PurchaseProgramResult.Fail("Invalid tier. Must be 'Basic', 'Standard', or 'Pro'.");

        // 2. Validate program exists and get pricing/spots info
        decimal? tierPrice;
        int? maxSpots;

        if (programType == ProgramType.Training)
        {
            var program = await _programRepository.GetByIdAsync(request.ProgramId);
            if (program == null || program.IsDeleted)
                return PurchaseProgramResult.Fail("Program not found.");

            (tierPrice, maxSpots) = GetTierInfo(program.Price, program.StandardPrice, program.ProPrice,
                program.MaxStandardSpots, program.MaxProSpots, tier);
        }
        else
        {
            var program = await _mealProgramRepository.GetByIdAsync(request.ProgramId);
            if (program == null || program.IsDeleted)
                return PurchaseProgramResult.Fail("Program not found.");

            (tierPrice, maxSpots) = GetTierInfo(program.Price, program.StandardPrice, program.ProPrice,
                program.MaxStandardSpots, program.MaxProSpots, tier);
        }

        // 3. Validate tier is available (has a price > 0)
        if (tierPrice == null || tierPrice <= 0)
            return PurchaseProgramResult.Fail("This tier is not available for purchase.");

        // 4. Check duplicate purchase
        var alreadyPurchased = await _purchaseRepository.ExistsAsync(
            request.UserId, request.ProgramId, programType, tier);

        if (alreadyPurchased)
            return PurchaseProgramResult.Fail("You have already purchased this program tier.");

        // 5. Check spots for Standard/Pro tiers
        if (tier != ProgramTier.Basic && maxSpots.HasValue && maxSpots.Value > 0)
        {
            var currentCount = await _purchaseRepository.CountByProgramAndTierAsync(
                request.ProgramId, programType, tier);

            if (currentCount >= maxSpots.Value)
                return PurchaseProgramResult.Fail("This tier is sold out.");
        }

        // 6. Create purchase
        var now = DateTime.UtcNow;
        var purchase = new ProgramPurchase
        {
            Id = Guid.NewGuid(),
            TrainingProgramId = programType == ProgramType.Training ? request.ProgramId : null,
            MealProgramId = programType == ProgramType.Meal ? request.ProgramId : null,
            UserId = request.UserId,
            PurchasedAt = now,
            Status = ProgramPurchaseStatus.Active,
            Tier = tier,
            ProgramType = programType,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _purchaseRepository.CreateAsync(purchase);

        return PurchaseProgramResult.Ok(purchase.Id);
    }

    private static (decimal? Price, int? MaxSpots) GetTierInfo(
        decimal basePrice, decimal? standardPrice, decimal? proPrice,
        int? maxStandardSpots, int? maxProSpots, ProgramTier tier)
    {
        return tier switch
        {
            ProgramTier.Basic => (basePrice, null), // Basic: unlimited spots
            ProgramTier.Standard => (standardPrice, maxStandardSpots),
            ProgramTier.Pro => (proPrice, maxProSpots),
            _ => (null, null)
        };
    }
}
