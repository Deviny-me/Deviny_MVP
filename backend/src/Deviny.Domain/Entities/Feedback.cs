using System.ComponentModel.DataAnnotations;

namespace Deviny.Domain.Entities
{
    public class Feedback
    {
        public int Id { get; set; }
        [Range(0, 5)]
        public decimal StarRating { get; set; }
        public long RatingScore { get; set; }
    }
}