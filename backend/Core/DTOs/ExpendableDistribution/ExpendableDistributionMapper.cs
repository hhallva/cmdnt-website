using System.Linq;
using Core.Models;

namespace Core.DTOs.ExpendableDistribution
{
    public static class ExpendableDistributionMapper
    {
        public static ExpendableDistributionDto ToGroupedDto(this IGrouping<int, Core.Models.ExpendableDistribution> group)
        {
            var first = group.First();
            var student = first.Student;

            var fullNameParts = new[] { student.Surname, student.Name, student.Patronymic }
                .Where(part => !string.IsNullOrWhiteSpace(part))
                .Select(part => part!.Trim());

            return new ExpendableDistributionDto
            {
                Id = group.Key,
                Student = new ExpendableDistributionStudentDto
                {
                    Id = student.Id,
                    FullName = string.Join(" ", fullNameParts),
                },
                Types = group
                    .OrderBy(item => item.Expendable.Type.Name)
                    .Select(item => new ExpendableDistributionTypeDto
                    {
                        Id = item.Id,
                        Name = item.Expendable.Type.Name,
                        Count = item.Count,
                    })
                    .ToList(),
            };
        }
    }
}
