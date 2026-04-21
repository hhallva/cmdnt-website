namespace Core.Models;

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

    public string? Image { get; set; }

    public virtual ICollection<Contact> Contacts { get; set; } = new List<Contact>();

    public virtual Group Group { get; set; } = null!;

    public virtual ICollection<Note> Notes { get; set; } = new List<Note>();

    public virtual ICollection<Resettlement> Resettlements { get; set; } = new List<Resettlement>();
}
