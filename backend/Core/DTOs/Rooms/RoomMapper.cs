using Core.Models;

namespace Core.DTOs.Rooms
{
    public static class RoomMapper
    {
        public static RoomDto ToDto(this Room room)
        {
            ArgumentNullException.ThrowIfNull(room);

            var activeResettlements = room.Resettlements
                .Where(resettlement => resettlement.CheckInDate.HasValue && !resettlement.CheckOutDate.HasValue)
                .ToList();

            return new RoomDto
            {
                Id = room.Id,
                FloorNumber = room.FloorNumber,
                RoomNumber = (room.FloorNumber * 100 + room.RoomNumber).ToString(),
                Capacity = room.Capacity,
                CurrentCapacity = activeResettlements.Count,
                GenderType = activeResettlements.Count == 0 ? null : activeResettlements[0].Student.Gender
            };
        }
    }
}


