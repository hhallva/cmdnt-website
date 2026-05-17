using System.ComponentModel.DataAnnotations;

namespace Core.DTOs.ExpendableDistributions
{
    public class ExpendableDistributionBatchItemDto
    {
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Некорректный идентификатор категории")]
        public int Id { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Количество должно быть больше 0")]
        public int Count { get; set; }
    }
}
