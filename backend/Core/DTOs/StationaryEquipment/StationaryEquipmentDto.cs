namespace Core.DTOs.StationaryEquipment
{
    public class StationaryEquipmentDto
    {
        public int Id { get; set; }

        public string InventoryNumber { get; set; } = null!;

        public int TypeId { get; set; }

        public string TypeName { get; set; } = null!;

        public int StatusId { get; set; }

        public string StatusName { get; set; } = null!;

        public int? RoomId { get; set; }

        public string? RoomNumber { get; set; }

        public int? RoomCapacity { get; set; }

        public int? BuildingId { get; set; }

        public string? BuildingName { get; set; }

        public string? Description { get; set; }
    }
}
