using System.ComponentModel.DataAnnotations;

namespace Core.DTOs.ExpendableDistribution
{
    public class ExpendableDistributionUpsertDto
    {
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Некорректный идентификатор студента")]
        public int StudentId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Некорректный идентификатор категории")]
        public int TypeId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Количество должно быть больше 0")]
        public int Count { get; set; }
    }
}
