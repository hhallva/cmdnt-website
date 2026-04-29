namespace Core.DTOs.Resettlements
{
    public class ResettlementRoommateDto
    {
        public int Id { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string? GroupName { get; set; }

        public int? GroupCourse { get; set; }
    }
}
