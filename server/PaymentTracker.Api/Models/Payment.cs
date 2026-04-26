namespace PaymentTracker.Api.Models;

public class Payment
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public DateTime DateReceived { get; set; }
    public DateTime ExpectedDate { get; set; }
    public string? Source { get; set; }
    public string? Notes { get; set; }
    public string? SenderImageUrl { get; set; }
    public string? ReceiverImageUrl { get; set; }
}
