using Core.Models;

namespace Core.DTOs.StationaryEquipment
{
    public static class StationaryEquipmentMapper
    {
        public static StationaryEquipmentDto ToDto(this Core.Models.StationaryEquipment equipment)
        {
            ArgumentNullException.ThrowIfNull(equipment);

            var room = equipment.Room;
            var building = room?.Building;
            var roomNumber = room == null ? null : (room.Floor * 100 + room.Number).ToString();

            return new StationaryEquipmentDto
            {
                Id = equipment.Id,
                InventoryNumber = equipment.InventoryNumber,
                TypeId = equipment.TypeId,
                TypeName = equipment.Type?.Name ?? string.Empty,
                StatusId = equipment.StatusId,
                StatusName = equipment.Status?.Name ?? string.Empty,
                RoomId = equipment.RoomId,
                RoomNumber = roomNumber,
                RoomCapacity = room?.Capacity,
                BuildingId = building?.Id,
                BuildingName = building?.Name,
                Description = equipment.Description,
            };
        }
    }
}
