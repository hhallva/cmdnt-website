namespace DataLayer.Models
{
    public partial class Student
    {
        public int Id { get; set; }

        public int GroupId { get; set; }

        public string Surname { get; set; } = null!;

        public string Name { get; set; } = null!;

        public string? Patronymic { get; set; }

        public string? Phone { get; set; }

        public DateTime? Birthday { get; set; }

        public bool Gender { get; set; }

        public bool IsHeadman { get; set; }

        public string? Origin { get; set; }


        public virtual Group Group { get; set; } = null!;

        public virtual ICollection<Contact> Contacts { get; set; } = new List<Contact>();

        public virtual ICollection<Room> Rooms { get; set; } = new List<Room>();

    }
}
