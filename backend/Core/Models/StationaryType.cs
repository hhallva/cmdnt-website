namespace Core.Models;

public partial class StationaryType
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<StationaryEquipment> StationaryEquipments { get; set; } = new List<StationaryEquipment>();
}
