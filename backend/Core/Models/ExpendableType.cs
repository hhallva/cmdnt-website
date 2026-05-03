namespace Core.Models;

public partial class ExpendableType
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<ExpendableEquipment> ExpendableEquipments { get; set; } = [];
}
