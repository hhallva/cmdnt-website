namespace Core.Models;

public partial class Contact
{
    public int Id { get; set; }

    public int StudentId { get; set; }

    public string Comment { get; set; } = null!;

    public string Phone { get; set; } = null!;

    public virtual Student Student { get; set; } = null!;
}
