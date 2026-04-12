namespace Core.Models
{
    public partial class Group
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public int Course { get; set; }

        public virtual ICollection<Student> Students { get; set; } = [];
    }
}