namespace Core.Models;

public partial class Resettlement
{
    public int StudentId { get; set; }

    public int RoomId { get; set; }

    public DateTime? CheckInDate { get; set; }

    public DateTime? CheckOutDate { get; set; }

    public virtual Room Room { get; set; } = null!;

    public virtual Student Student { get; set; } = null!;
}
