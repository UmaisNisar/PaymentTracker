using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PaymentTracker.Api.Data;
using PaymentTracker.Api.DTOs;
using PaymentTracker.Api.Models;
using PaymentTracker.Api.Options;

namespace PaymentTracker.Api.Services;

public class PaymentScheduleService(AppDbContext db, IOptions<PaymentTrackerOptions> trackerOptions)
{
    private readonly decimal _expectedWeeklyAmount = trackerOptions.Value.ExpectedWeeklyAmount;
    private readonly string _currency = trackerOptions.Value.Currency;

    public static IEnumerable<DateTime> GetFridaysInMonth(int year, int month)
    {
        var day = new DateTime(year, month, 1);
        var end = day.AddMonths(1);
        while (day < end)
        {
            if (day.DayOfWeek == DayOfWeek.Friday)
                yield return day.Date;
            day = day.AddDays(1);
        }
    }

    public async Task<PaymentSummaryResponse> GetSummaryAsync(int year, int month, CancellationToken ct = default)
    {
        var monthSkipped = await db.SkippedMonths
            .AsNoTracking()
            .AnyAsync(s => s.Year == year && s.Month == month, ct);

        var fridays = GetFridaysInMonth(year, month).ToList();
        var fridayDates = fridays.Select(DateOnly.FromDateTime).ToHashSet();

        var payments = await db.Payments
            .AsNoTracking()
            .Where(p => p.ExpectedDate.Year == year && p.ExpectedDate.Month == month)
            .ToListAsync(ct);

        var byExpectedDay = payments
            .Where(p => fridayDates.Contains(DateOnly.FromDateTime(p.ExpectedDate)))
            .GroupBy(p => DateOnly.FromDateTime(p.ExpectedDate))
            .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.DateReceived).First());

        var totalReceived = byExpectedDay.Values.Sum(p => p.Amount);

        if (monthSkipped)
        {
            return new PaymentSummaryResponse(
                totalReceived,
                0,
                0,
                0,
                _expectedWeeklyAmount,
                _currency,
                true);
        }

        var expectedTotal = fridays.Count * _expectedWeeklyAmount;

        var missing = 0;
        var underpaid = 0;
        foreach (var friday in fridays)
        {
            var key = DateOnly.FromDateTime(friday);
            if (!byExpectedDay.TryGetValue(key, out var payment))
            {
                missing++;
                continue;
            }

            if (payment.Amount < _expectedWeeklyAmount)
                underpaid++;
        }

        return new PaymentSummaryResponse(
            totalReceived,
            expectedTotal,
            missing,
            underpaid,
            _expectedWeeklyAmount,
            _currency,
            false);
    }

    public static PaymentResponse ToResponse(Payment p) =>
        new(
            p.Id,
            p.Amount,
            p.DateReceived,
            p.ExpectedDate,
            p.Source,
            p.Notes,
            p.SenderImageUrl,
            p.ReceiverImageUrl);
}
