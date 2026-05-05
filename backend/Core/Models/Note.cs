namespace Core.Models;

public partial class Note
{
    public int Id { get; set; }

    public int StudentId { get; set; }

    public int? UserId { get; set; }

    public string Text { get; set; } = null!;

    public DateTime CreateDate { get; set; }

    public virtual Student Student { get; set; } = null!;

    public virtual User? User { get; set; }
}
