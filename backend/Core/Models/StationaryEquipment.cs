namespace Core.Models;

public partial class StationaryEquipment
{
    public int Id { get; set; }

    public string InventoryNumber { get; set; } = null!;

    public int TypeId { get; set; }

    public int StatusId { get; set; }

    public int? RoomId { get; set; }

    public string? Description { get; set; }

    public virtual Room? Room { get; set; }

    public virtual Status Status { get; set; } = null!;

    public virtual StationaryType Type { get; set; } = null!;
}
