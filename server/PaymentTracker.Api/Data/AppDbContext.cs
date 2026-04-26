using Microsoft.EntityFrameworkCore;
using PaymentTracker.Api.Models;

namespace PaymentTracker.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<SkippedMonth> SkippedMonths => Set<SkippedMonth>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Payment>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Amount).HasPrecision(18, 2);
            e.Property(p => p.Source).HasMaxLength(256);
            e.Property(p => p.Notes).HasMaxLength(2000);
            e.Property(p => p.SenderImageUrl).HasMaxLength(1024);
            e.Property(p => p.ReceiverImageUrl).HasMaxLength(1024);
        });

        modelBuilder.Entity<SkippedMonth>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => new { s.Year, s.Month }).IsUnique();
        });
    }
}
