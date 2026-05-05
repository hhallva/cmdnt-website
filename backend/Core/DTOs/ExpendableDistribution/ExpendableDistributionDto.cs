namespace Core.DTOs.ExpendableDistribution
{
    public class ExpendableDistributionStudentDto
    {
        public int Id { get; set; }

        public string FullName { get; set; } = string.Empty;
    }

    public class ExpendableDistributionTypeDto
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public int Count { get; set; }
    }

    public class ExpendableDistributionDto
    {
        public int Id { get; set; }

        public ExpendableDistributionStudentDto Student { get; set; } = new();

        public List<ExpendableDistributionTypeDto> Types { get; set; } = [];
    }
}
