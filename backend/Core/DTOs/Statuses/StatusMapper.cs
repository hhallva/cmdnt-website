using Core.Models;

namespace Core.DTOs.Statuses
{
    public static class StatusMapper
    {
        public static StatusDto ToDto(this Status status)
        {
            ArgumentNullException.ThrowIfNull(status);

            return new StatusDto
            {
                Id = status.Id,
                Name = status.Name,
            };
        }
    }
}
