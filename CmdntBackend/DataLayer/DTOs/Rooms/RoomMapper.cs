using DataLayer.Models;

namespace DataLayer.DTOs.Rooms
{
    public static class RoomMapper
    {
        public static RoomDto ToDto(this Room room)
        {
            ArgumentNullException.ThrowIfNull(room);

            return new RoomDto
            {
                Id = room.Id,
                FloorNumber = room.FloorNumber,
                RoomNumber = (room.FloorNumber * 100 + room.RoomNumber).ToString(),
                Capacity = room.Capacity,
                CurrentCapacity = room.Students.Count,
                GenderType = room.Students.Count == 0 ? null : room.Students.First().Gender
            };
        }
    }
}


