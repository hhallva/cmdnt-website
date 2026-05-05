namespace Core.DTOs.Resettlements
{
    public class ResettlementHistoryDto
    {
        public int ResettlementId { get; set; }

        public int RoomId { get; set; }

        public string RoomNumber { get; set; } = string.Empty;

        public int FloorNumber { get; set; }

        public int BuildingId { get; set; }

        public int Capacity { get; set; }

        public DateTime CheckInDate { get; set; }

        public DateTime CheckOutDate { get; set; }

        public List<ResettlementRoommateDto> Roommates { get; set; } = new();
    }
}
