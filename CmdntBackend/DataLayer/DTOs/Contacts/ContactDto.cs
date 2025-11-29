using System.ComponentModel.DataAnnotations;

namespace DataLayer.DTOs.Contacts
{
    public class ContactDto(string comment, string phone)
    {
        [Required(ErrorMessage = "Комментарий обязателен")]
        public string Comment { get; set; } = comment;

        [Required(ErrorMessage = "Телефон обязателен")]
        public string Phone { get; set; } = phone;
    }
}
