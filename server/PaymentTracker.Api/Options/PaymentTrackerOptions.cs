namespace PaymentTracker.Api.Options;

public class PaymentTrackerOptions
{
    public const string SectionName = "PaymentTracker";

    public decimal ExpectedWeeklyAmount { get; set; } = 2000m;

    /// <summary>ISO 4217 code for display and emails (e.g. CAD).</summary>
    public string Currency { get; set; } = "CAD";

    /// <summary>Fridays on or after this date are considered for tracking and weekly emails (UTC date).</summary>
    public DateTime? TrackingStartDate { get; set; }
}
