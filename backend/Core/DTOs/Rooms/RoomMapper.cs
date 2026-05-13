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

            bool? genderType = null;
            if (activeResettlements.Count > 0)
            {
                var distinctGenders = activeResettlements
                    .Select(resettlement => resettlement.Student.Gender)
                    .Distinct()
                    .ToList();

                if (distinctGenders.Count == 1)
                {
                    genderType = distinctGenders[0];
                }
            }

            return new RoomDto
            {
                Id = room.Id,
                Floor = room.Floor,
                Number = (room.Floor * 100 + room.Number).ToString(),
                Capacity = room.Capacity,
                CurrentCapacity = activeResettlements.Count,
                GenderType = genderType
            };
        }
    }
}


