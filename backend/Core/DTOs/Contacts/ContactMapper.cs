using Core.Models;

namespace Core.DTOs.Contacts
{
    public static class ContactMapper
    {
        public static ContactDto ToDto(this Contact contact)
        {
            ArgumentNullException.ThrowIfNull(contact);

            return new ContactDto(contact.Comment, contact.Phone);
        }
    }
}
