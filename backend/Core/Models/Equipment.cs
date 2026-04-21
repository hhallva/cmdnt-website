namespace Core.Models;

public partial class Equipment
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int Count { get; set; }

    public virtual ICollection<RoomEquipment> RoomEquipments { get; set; } = new List<RoomEquipment>();
}
