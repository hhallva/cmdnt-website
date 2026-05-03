namespace Core.Models;

public partial class ExpendableEquipment
{
    public int Id { get; set; }

    public int TypeId { get; set; }

    public int Count { get; set; }

    public virtual ICollection<ExpendablesDistribution> ExpendablesDistributions { get; set; } = [];

    public virtual ExpendableType Type { get; set; } = null!;
}
