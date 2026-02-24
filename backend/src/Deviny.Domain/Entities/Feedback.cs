using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Deviny.Domain.Entities
{
    public class Feedback
    {
        public int Id { get; set; }
        [Range(0, 5)]
        public decimal StarRating { get; set; } = 5;
        public long RatingScore { get; set; } = 0;
        public Guid UserId { get; set; }
        [JsonIgnore]
        public User User { get; set; }
    }
}