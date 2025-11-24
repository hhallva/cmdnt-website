namespace DataLayer.DTOs.Notes
{
    public partial class NoteDto
    {
        public int Id { get; set; }

        public int StudentId { get; set; }

        public string Text { get; set; } = null!;

        public DateTime CreateDate { get; set; }

        public Author? Author { get; set; }
    }
}