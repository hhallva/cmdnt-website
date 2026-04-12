namespace Core.DTOs.Notes
{
    public class PostNoteDto
    {
        public int StudentId { get; set; }

        public int? UserId { get; set; }

        public string Text { get; set; } = null!;
    }
}
