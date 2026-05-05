using System.Linq;
using Core.Models;

namespace Core.DTOs.ExpendableDistribution
{
    public static class ExpendableDistributionMapper
    {
        public static ExpendableDistributionDto ToDto(this Core.Models.ExpendableDistribution entity)
        {
            var student = entity.Student;
            var fullNameParts = new[] { student.Surname, student.Name, student.Patronymic }
                .Where(part => !string.IsNullOrWhiteSpace(part))
                .Select(part => part!.Trim());

            return new ExpendableDistributionDto
            {
                Id = entity.Id,
                StudentId = entity.StudentId,
                StudentFullName = string.Join(" ", fullNameParts),
                TypeId = entity.Expendable.TypeId,
                TypeName = entity.Expendable.Type.Name,
                Count = entity.Count,
            };
        }
    }
}
