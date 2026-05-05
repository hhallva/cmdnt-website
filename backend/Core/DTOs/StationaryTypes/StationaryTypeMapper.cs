using Core.Models;

namespace Core.DTOs.StationaryTypes
{
    public static class StationaryTypeMapper
    {
        public static StationaryTypeDto ToDto(this StationaryType type)
        {
            ArgumentNullException.ThrowIfNull(type);

            return new StationaryTypeDto
            {
                Id = type.Id,
                Name = type.Name,
            };
        }
    }
}
