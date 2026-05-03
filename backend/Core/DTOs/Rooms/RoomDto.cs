namespace Core.DTOs.Rooms
{
    public class RoomDto
    {
        public int Id { get; set; }

        public int Floor { get; set; }

        public string Number { get; set; } = null!;

        public int Capacity { get; set; }

        public int CurrentCapacity { get; set; }

        public bool? GenderType { get; set; }
    }
}
