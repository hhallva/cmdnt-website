namespace Core.Models;

public partial class ExpendableDistribution
{
    public int Id { get; set; }

    public int StudentId { get; set; }

    public int ExpendableId { get; set; }

    public int Count { get; set; }

    public virtual ExpendableEquipment Expendable { get; set; } = null!;

    public virtual Student Student { get; set; } = null!;
}
