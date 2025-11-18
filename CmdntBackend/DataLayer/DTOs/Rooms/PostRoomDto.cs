using System.ComponentModel.DataAnnotations;

namespace DataLayer.DTOs.Rooms
{
    public class PostRoomDto
    {
        [Required(ErrorMessage = "Номер этажа обязателен.")]
        public int FloorNumber { get; set; }

        [Required(ErrorMessage = "Номер комнаты обязателен.")]
        public int RoomNumber { get; set; }

        [Required(ErrorMessage = "Вместительность комнаты обязательна.")]
        [Range(1, int.MaxValue, ErrorMessage = "Объем вместительности может быть только положительным числом")]
        public int Capacity { get; set; }
    }
}