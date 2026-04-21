namespace Core.DTOs
{
    public class ApiErrorDto(long timestamp, string message, int errorCode)
    {
        public long Timestamp { get; } = timestamp;

        public string Message { get; } = message;

        public int ErrorCode { get; } = errorCode;

        public ApiErrorDto(string message, int errorCode) :
            this(DateTimeOffset.UtcNow.ToUnixTimeSeconds(), message, errorCode)
        { }
    }
}
