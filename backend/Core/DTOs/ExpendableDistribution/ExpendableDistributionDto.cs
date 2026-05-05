namespace Core.DTOs.ExpendableDistribution
{
    public class ExpendableDistributionDto
    {
        public int Id { get; set; }

        public int StudentId { get; set; }

        public string StudentFullName { get; set; } = string.Empty;

        public int TypeId { get; set; }

        public string TypeName { get; set; } = string.Empty;

        public int Count { get; set; }
    }
}
