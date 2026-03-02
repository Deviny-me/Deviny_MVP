namespace Deviny.Application.Features.Trainers.DTOs;

public class TrainerRatingDto
{
    public Guid TrainerUserId { get; set; }
    public double RatingValue { get; set; }
    public int ReviewsCount { get; set; }
    public int TotalSales { get; set; }
    public double ActivityRatingValue { get; set; }
    public int TotalLikes { get; set; }
    public int TotalComments { get; set; }
}

