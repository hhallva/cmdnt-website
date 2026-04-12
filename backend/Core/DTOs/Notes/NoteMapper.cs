using System.Linq;
using Core.DTOs;
using Core.Models;

namespace Core.DTOs.Notes
{
    public static class NoteMapper
    {
        private static string? BuildAuthorName(User? user)
        {
            if (user == null)
            {
                return null;
            }

            var surname = string.IsNullOrWhiteSpace(user.Surname) ? null : user.Surname.Trim();

            var initials = new[] { GetInitial(user.Name), GetInitial(user.Patronymic) }
            .Where(initial => initial != null)
            .Select(initial => $"{initial}.");

            var parts = new[] { surname, string.Join(" ", initials) }
            .Where(part => !string.IsNullOrWhiteSpace(part))
            .ToArray();

            return parts.Length == 0 ? null : string.Join(" ", parts);
        }

        private static string? GetInitial(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            var trimmed = value.Trim();
            return trimmed.Length == 0 ? null : char.ToUpper(trimmed[0]).ToString();
        }

        private static Author? BuildAuthor(User? user)
        {
            if (user == null)
                return null;

            var displayName = BuildAuthorName(user)
                ?? (string.IsNullOrWhiteSpace(user.Name) ? null : user.Name.Trim())
                ?? "Сотрудник общежития";

            return new Author
            {
                Id = user.Id,
                Name = displayName,
                Role = user.Role == null
                    ? null
                    : new RoleDto
                    {
                        Id = user.Role.Id,
                        Name = user.Role.Name
                    }
            };
        }

        public static NoteDto ToDto(this Note note)
        {
            ArgumentNullException.ThrowIfNull(note);

            return new NoteDto
            {
                Id = note.Id,
                StudentId = note.StudentId,
                Text = note.Text,
                CreateDate = note.CreateDate,
                Author = BuildAuthor(note.User)
            };
        }
    }
}
