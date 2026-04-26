using System.Globalization;
using Microsoft.EntityFrameworkCore;
using PaymentTracker.Api.Data;
using PaymentTracker.Api.DTOs;
using PaymentTracker.Api.Models;
using PaymentTracker.Api.Options;
using PaymentTracker.Api.Services;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<PaymentTrackerOptions>(
    builder.Configuration.GetSection(PaymentTrackerOptions.SectionName));
builder.Services.Configure<CloudinaryOptions>(
    builder.Configuration.GetSection(CloudinaryOptions.SectionName));

var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings:Default is not set.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<PaymentScheduleService>();
builder.Services.AddSingleton<CloudinaryUploader>();

var allowedOrigins = (builder.Configuration["AllowedOrigins"] ?? "http://localhost:5173,http://127.0.0.1:5173")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .WithOrigins(allowedOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()));

var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

var app = builder.Build();

app.UseCors();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

app.MapGet("/", () => Results.Ok(new { service = "payment-tracker-api", status = "ok" }));
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

var payments = app.MapGroup("/payments");

payments.MapGet("/", async (AppDbContext db, CancellationToken ct) =>
{
    var list = await db.Payments
        .AsNoTracking()
        .OrderByDescending(p => p.DateReceived)
        .ToListAsync(ct);
    return Results.Ok(list.Select(PaymentScheduleService.ToResponse));
});

payments.MapPost("/", async (HttpRequest req, AppDbContext db, CloudinaryUploader uploader, CancellationToken ct) =>
{
    if (!req.HasFormContentType)
        return Results.BadRequest("Use multipart/form-data.");

    var form = await req.ReadFormAsync(ct);
    if (!decimal.TryParse(form["amount"], NumberStyles.Number, CultureInfo.InvariantCulture, out var amount))
        return Results.BadRequest("Invalid amount.");
    if (amount < 0)
        return Results.BadRequest("Amount must be non-negative.");

    if (!DateTime.TryParse(form["dateReceived"], CultureInfo.InvariantCulture, DateTimeStyles.None, out var dateReceived))
        return Results.BadRequest("Invalid dateReceived.");
    if (!DateTime.TryParse(form["expectedDate"], CultureInfo.InvariantCulture, DateTimeStyles.None, out var expectedDate))
        return Results.BadRequest("Invalid expectedDate.");

    dateReceived = DateTime.SpecifyKind(dateReceived, DateTimeKind.Utc);
    expectedDate = DateTime.SpecifyKind(expectedDate, DateTimeKind.Utc);

    var source = form["source"].ToString();
    var notes = form["notes"].ToString();

    var senderFile = form.Files.GetFile("senderImage");
    var receiverFile = form.Files.GetFile("receiverImage");
    if (senderFile is not { Length: > 0 })
        return Results.BadRequest("senderImage is required.");
    if (receiverFile is not { Length: > 0 })
        return Results.BadRequest("receiverImage is required.");

    const long maxBytes = 15 * 1024 * 1024;
    if (senderFile.Length > maxBytes || receiverFile.Length > maxBytes)
        return Results.BadRequest("Each image must be 15 MB or smaller.");

    if (!IsAllowedImage(senderFile) || !IsAllowedImage(receiverFile))
        return Results.BadRequest("Image must be jpg, png, gif, or webp.");

    var id = Guid.NewGuid();
    string senderUrl, receiverUrl;
    try
    {
        senderUrl = await uploader.UploadImageAsync(senderFile, $"{id:N}_sender", ct);
        receiverUrl = await uploader.UploadImageAsync(receiverFile, $"{id:N}_receiver", ct);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Image upload failed: {ex.Message}", statusCode: 502);
    }

    var entity = new Payment
    {
        Id = id,
        Amount = amount,
        DateReceived = dateReceived,
        ExpectedDate = expectedDate,
        Source = string.IsNullOrWhiteSpace(source) ? null : source.Trim(),
        Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim(),
        SenderImageUrl = senderUrl,
        ReceiverImageUrl = receiverUrl
    };

    db.Payments.Add(entity);
    await db.SaveChangesAsync(ct);
    return Results.Created($"/payments/{entity.Id}", PaymentScheduleService.ToResponse(entity));
});

payments.MapGet("/summary", async (string month, PaymentScheduleService schedule, CancellationToken ct) =>
{
    if (!TryParseMonth(month, out var year, out var m))
        return Results.BadRequest("month must be YYYY-MM.");

    var summary = await schedule.GetSummaryAsync(year, m, ct);
    return Results.Ok(summary);
});

var skipped = app.MapGroup("/skipped-months");

skipped.MapGet("/", async (AppDbContext db, CancellationToken ct) =>
{
    var list = await db.SkippedMonths
        .AsNoTracking()
        .OrderBy(s => s.Year).ThenBy(s => s.Month)
        .Select(s => new SkippedMonthResponse(s.Year, s.Month))
        .ToListAsync(ct);
    return Results.Ok(list);
});

skipped.MapPost("/", async (SkipMonthRequest body, AppDbContext db, CancellationToken ct) =>
{
    if (body.Year is < 1 or > 9999 || body.Month is < 1 or > 12)
        return Results.BadRequest("Invalid year or month.");

    var exists = await db.SkippedMonths.AnyAsync(s => s.Year == body.Year && s.Month == body.Month, ct);
    if (exists)
        return Results.Ok(new SkippedMonthResponse(body.Year, body.Month));

    db.SkippedMonths.Add(new SkippedMonth
    {
        Id = Guid.NewGuid(),
        Year = body.Year,
        Month = body.Month
    });
    await db.SaveChangesAsync(ct);
    return Results.Created($"/skipped-months/{body.Year}/{body.Month}", new SkippedMonthResponse(body.Year, body.Month));
});

skipped.MapDelete("/{year:int}/{month:int}", async (int year, int month, AppDbContext db, CancellationToken ct) =>
{
    await db.SkippedMonths
        .Where(s => s.Year == year && s.Month == month)
        .ExecuteDeleteAsync(ct);
    return Results.NoContent();
});

app.Run();

static bool TryParseMonth(string month, out int year, out int m)
{
    year = 0;
    m = 0;
    var parts = month.Split('-', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    if (parts.Length != 2)
        return false;
    if (!int.TryParse(parts[0], out year) || !int.TryParse(parts[1], out m))
        return false;
    if (year is < 1 or > 9999 || m is < 1 or > 12)
        return false;
    return true;
}

static bool IsAllowedImage(IFormFile file)
{
    var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
    var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    return allowed.Contains(ext);
}
