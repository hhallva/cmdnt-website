using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Core.Data;
using Core.Models;
using Core.DTOs.Notes;
using Core.DTOs;
using Swashbuckle.AspNetCore.Annotations;
using Microsoft.AspNetCore.Authorization;

namespace API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class NotesController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<NoteDto>>> GetNotes()
        {
            var notes = await _context.Notes
                .Include(n => n.User)
                .ThenInclude(u => u.Role)
                .OrderByDescending(n => n.CreateDate)
                .ToListAsync();

            return notes.Select(n => n.ToDto()).ToList();
        }

        [HttpGet("student/{studentId:int}")]
        [SwaggerOperation(Summary = "Получение заметок студента", Description = "Возвращает отсортированный список заметок, связанных с конкретным студентом.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Заметки успешно получены.", Type = typeof(IEnumerable<NoteDto>))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Студент не найден.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<IEnumerable<NoteDto>>> GetNotesByStudentId(int studentId)
        {
            var studentExists = await _context.Students.AnyAsync(s => s.Id == studentId);

            if (!studentExists)
                return NotFound(new ApiErrorDto("Студент не найден", StatusCodes.Status404NotFound));

            var notes = await _context.Notes
                .Include(note => note.User)
                .ThenInclude(user => user.Role)
                .Where(note => note.StudentId == studentId)
                .OrderByDescending(note => note.CreateDate)
                .ToListAsync();

            return notes.Select(note => note.ToDto()).ToList();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<NoteDto>> GetNote(int id)
        {
            var note = await _context.Notes
                .Include(n => n.User)
                .ThenInclude(u => u.Role)
                .FirstOrDefaultAsync(n => n.Id == id);

            if (note == null)
                return NotFound(new ApiErrorDto("Заметка не найдена", StatusCodes.Status404NotFound));

            return note.ToDto();
        }

        [HttpPost]
        public async Task<ActionResult<NoteDto>> PostNote(PostNoteDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Text))
                return BadRequest(new ApiErrorDto("Текст заметки обязателен", StatusCodes.Status400BadRequest));

            var studentExists = await _context.Students.AnyAsync(s => s.Id == dto.StudentId);
            if (!studentExists)
                return NotFound(new ApiErrorDto("Студент не найден", StatusCodes.Status404NotFound));

            var note = new Note
            {
                StudentId = dto.StudentId,
                UserId = dto.UserId,
                Text = dto.Text.Trim(),
                CreateDate = DateTime.UtcNow
            };

            _context.Notes.Add(note);
            await _context.SaveChangesAsync();
            await _context.Entry(note).Reference(n => n.User).LoadAsync();
            if (note.User != null)
            {
                await _context.Entry(note.User).Reference(u => u.Role).LoadAsync();
            }

            return CreatedAtAction(nameof(GetNote), new { id = note.Id }, note.ToDto());
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNote(int id)
        {
            var note = await _context.Notes.FindAsync(id);
            if (note == null)
                return NotFound(new ApiErrorDto("Заметка не найдена", StatusCodes.Status404NotFound));

            _context.Notes.Remove(note);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
