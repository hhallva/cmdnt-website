using System.ComponentModel.DataAnnotations;

namespace Core.DTOs.StationaryTypes
{
    public class PostStationaryTypeDto
    {
        [Required(ErrorMessage = "Название обязательно.")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Название должно содержать от 1 до 100 символов.")]
        public string Name { get; set; } = null!;
    }
}
