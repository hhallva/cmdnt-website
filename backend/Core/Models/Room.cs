namespace Core.Models
{
    public partial class Room
    {
        public int Id { get; set; }

        public int BuildingId { get; set; }

        public int FloorNumber { get; set; }

        public int RoomNumber { get; set; }

        public int Capacity { get; set; }

        public virtual Building Building { get; set; } = null!;

        public virtual ICollection<Student> Students { get; set; } = [];
    }
}