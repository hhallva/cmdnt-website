namespace Core.DTOs.Buildings
{
    public class BuildingDto
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public string Address { get; set; } = null!;

        public Coordinates Coordinates { get; set; } = null!;
    }
}
