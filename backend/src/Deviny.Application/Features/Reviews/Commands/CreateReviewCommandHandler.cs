using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using MediatR;

namespace Deviny.Application.Features.Reviews.Commands;

public class CreateReviewCommandHandler : IRequestHandler<CreateReviewCommand, CreateReviewResult>
{
    private readonly IProgramReviewRepository _reviewRepository;
    private readonly IProgramPurchaseRepository _purchaseRepository;
    private readonly IProgramRepository _programRepository;
    private readonly IMealProgramRepository _mealProgramRepository;

    public CreateReviewCommandHandler(
        IProgramReviewRepository reviewRepository,
        IProgramPurchaseRepository purchaseRepository,
        IProgramRepository programRepository,
        IMealProgramRepository mealProgramRepository)
    {
        _reviewRepository = reviewRepository;
        _purchaseRepository = purchaseRepository;
        _programRepository = programRepository;
        _mealProgramRepository = mealProgramRepository;
    }

    public async Task<CreateReviewResult> Handle(CreateReviewCommand request, CancellationToken cancellationToken)
    {
        // 1. Parse program type
        if (!Enum.TryParse<ProgramType>(request.ProgramType, ignoreCase: true, out var programType))
            return CreateReviewResult.Fail("Invalid program type. Must be 'training' or 'meal'.");

        // 2. Validate rating
        if (request.Rating < 1 || request.Rating > 5)
            return CreateReviewResult.Fail("Rating must be between 1 and 5.");

        // 3. Validate program exists
        if (programType == ProgramType.Training)
        {
            var program = await _programRepository.GetByIdAsync(request.ProgramId);
            if (program == null)
                return CreateReviewResult.Fail("Program not found.");
        }
        else
        {
            var program = await _mealProgramRepository.GetByIdAsync(request.ProgramId);
            if (program == null)
                return CreateReviewResult.Fail("Program not found.");
        }

        // 4. Validate user has purchased this program
        var hasPurchased = await _purchaseRepository.HasPurchasedAsync(
            request.UserId, request.ProgramId, programType);

        if (!hasPurchased)
            return CreateReviewResult.Fail("You can only review programs you have purchased.");

        // 5. Check duplicate review
        var alreadyReviewed = await _reviewRepository.ExistsAsync(
            request.UserId, request.ProgramId, programType);

        if (alreadyReviewed)
            return CreateReviewResult.Fail("You have already reviewed this program.");

        // 6. Create review
        var now = DateTime.UtcNow;
        var review = new ProgramReview
        {
            Id = Guid.NewGuid(),
            TrainingProgramId = programType == ProgramType.Training ? request.ProgramId : null,
            MealProgramId = programType == ProgramType.Meal ? request.ProgramId : null,
            UserId = request.UserId,
            ProgramType = programType,
            Rating = request.Rating,
            Comment = request.Comment?.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        await _reviewRepository.CreateAsync(review);

        return CreateReviewResult.Ok(review.Id);
    }
}
