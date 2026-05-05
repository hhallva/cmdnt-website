using Core.Models;

namespace Core.DTOs.ExpendableTypes
{
    public static class ExpendableTypeMapper
    {
        public static ExpendableTypeDto ToDto(this ExpendableType type)
        {
            ArgumentNullException.ThrowIfNull(type);

            return new ExpendableTypeDto
            {
                Id = type.Id,
                Name = type.Name,
            };
        }
    }
}
