namespace DataLayer.Models
{
    public partial class Room
    {
        public int Id { get; set; }

        public int FloorNumber { get; set; }

        public int RoomNumber { get; set; }

        public int Capacity { get; set; }

        public virtual ICollection<Student> Students { get; set; } = new List<Student>();
    }

}
