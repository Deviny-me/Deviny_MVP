using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Programs.DTOs;
using MediatR;

namespace Deviny.Application.Features.Programs.Queries;

public class GetMyProgramsQueryHandler : IRequestHandler<GetMyProgramsQuery, List<ProgramDto>>
{
    private readonly IProgramRepository _programRepository;

    public GetMyProgramsQueryHandler(IProgramRepository programRepository)
    {
        _programRepository = programRepository;
    }

    public async Task<List<ProgramDto>> Handle(GetMyProgramsQuery request, CancellationToken cancellationToken)
    {
        var items = await _programRepository.GetByTrainerIdWithStatsAsync(request.TrainerId);

        return items.Select(s =>
        {
            var videoMetadata = ProgramVideoJsonHelper.Parse(s.Program.TrainingVideosPath);
            var videoPaths = videoMetadata.Select(v => v.VideoUrl).ToList();

            return new ProgramDto
            {
                Id = s.Program.Id,
                Title = s.Program.Title,
                Description = s.Program.Description,
                DetailedDescription = s.Program.DetailedDescription,
                Price = s.Program.Price,
                StandardPrice = s.Program.StandardPrice,
                ProPrice = s.Program.ProPrice,
                MaxStandardSpots = s.Program.MaxStandardSpots,
                MaxProSpots = s.Program.MaxProSpots,
                Category = s.Program.Category.ToString(),
                Code = s.Program.Code,
                CoverImageUrl = s.Program.CoverImagePath,
                TrainingVideoUrls = videoPaths,
                TrainingVideos = videoMetadata,
                IsPublic = s.Program.IsPublic,
                AverageRating = s.AverageRating,
                TotalReviews = s.TotalReviews,
                TotalPurchases = s.TotalPurchases,
                CreatedAt = s.Program.CreatedAt,
                UpdatedAt = s.Program.UpdatedAt
            };
        }).ToList();
    }
}
