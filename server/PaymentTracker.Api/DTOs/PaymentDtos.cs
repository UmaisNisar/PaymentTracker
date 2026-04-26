namespace PaymentTracker.Api.DTOs;

public record PaymentResponse(
    Guid Id,
    decimal Amount,
    DateTime DateReceived,
    DateTime ExpectedDate,
    string? Source,
    string? Notes,
    string? SenderImageUrl,
    string? ReceiverImageUrl);

public record PaymentSummaryResponse(
    decimal TotalReceived,
    decimal ExpectedTotal,
    int MissingPayments,
    int UnderpaidPayments,
    decimal ExpectedWeeklyAmount,
    string Currency,
    bool MonthSkipped);

public record SkippedMonthResponse(int Year, int Month);

public record SkipMonthRequest(int Year, int Month);
