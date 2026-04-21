using Core.Models;

namespace Core.DTOs.Buildings
{
    public static class BuildingMapper
    {
        public static BuildingDto ToDto(this Building building)
        {
            ArgumentNullException.ThrowIfNull(building);

            return new BuildingDto
            {
                Id = building.Id,
                Name = building.Name,
                Address = building.Address,
                Coordinates = new Coordinates
                {
                    Longitude = building.Longitude,
                    Latitude = building.Latitude,
                },
            };
        }
    }
}
