using Deviny.Application.Features.Trainers.DTOs;
using MediatR;

namespace Deviny.Application.Features.Trainers.Queries;

public record GetAllTrainersQuery : IRequest<List<PublicTrainerDto>>;
