using Ignite.Application.Features.Trainers.DTOs;
using MediatR;

namespace Ignite.Application.Features.Trainers.Queries;

public record GetAllTrainersQuery : IRequest<List<PublicTrainerDto>>;
