namespace CmdntApi.Models
{
    public partial class Role
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public virtual ICollection<User> Users { get; set; } = new List<User>();
    }
}
