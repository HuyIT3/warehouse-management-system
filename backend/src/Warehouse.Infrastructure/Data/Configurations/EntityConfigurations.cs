using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Username)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(u => u.Username)
            .IsUnique();

        builder.Property(u => u.FullName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.PasswordHash)
            .IsRequired();

        builder.Property(u => u.Role)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();
    }
}

public class MaterialConfiguration : IEntityTypeConfiguration<Material>
{
    public void Configure(EntityTypeBuilder<Material> builder)
    {
        builder.HasKey(m => m.Id);

        builder.Property(m => m.MaterialCode)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(m => m.MaterialCode)
            .IsUnique();

        builder.Property(m => m.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(m => m.Unit)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(m => m.Category)
            .HasMaxLength(100);

        builder.Property(m => m.Description)
            .HasMaxLength(500);
    }
}

public class LocationConfiguration : IEntityTypeConfiguration<Location>
{
    public void Configure(EntityTypeBuilder<Location> builder)
    {
        builder.HasKey(l => l.Id);

        builder.Property(l => l.LocationCode)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(l => l.LocationCode)
            .IsUnique();

        builder.Property(l => l.Rack)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(l => l.Slot)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(l => l.Description)
            .HasMaxLength(300);
    }
}

public class InventoryConfiguration : IEntityTypeConfiguration<Inventory>
{
    public void Configure(EntityTypeBuilder<Inventory> builder)
    {
        builder.HasKey(i => i.Id);

        // Unique composite index: 1 Material can only have 1 Inventory record per Location
        builder.HasIndex(i => new { i.MaterialId, i.LocationId })
            .IsUnique();

        builder.HasOne(i => i.Material)
            .WithMany(m => m.Inventories)
            .HasForeignKey(i => i.MaterialId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Location)
            .WithMany(l => l.Inventories)
            .HasForeignKey(i => i.LocationId)
            .OnDelete(DeleteBehavior.Restrict);

        // Optimistic concurrency token
        builder.Property(i => i.RowVersion)
            .IsRowVersion();
    }
}

public class StockTransactionConfiguration : IEntityTypeConfiguration<StockTransaction>
{
    public void Configure(EntityTypeBuilder<StockTransaction> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.TransactionType)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(t => t.Note)
            .HasMaxLength(500);

        builder.HasOne(t => t.Material)
            .WithMany(m => m.StockTransactions)
            .HasForeignKey(t => t.MaterialId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Location)
            .WithMany(l => l.StockTransactions)
            .HasForeignKey(t => t.LocationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.User)
            .WithMany(u => u.StockTransactions)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(t => t.CreatedAt);
        builder.HasIndex(t => t.TransactionType);
    }
}

public class StockRequestConfiguration : IEntityTypeConfiguration<StockRequest>
{
    public void Configure(EntityTypeBuilder<StockRequest> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.RequestCode)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(r => r.RequestCode)
            .IsUnique();

        builder.Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.HasOne(r => r.RequestedByUser)
            .WithMany(u => u.StockRequests)
            .HasForeignKey(r => r.RequestedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class GoodsReceiptConfiguration : IEntityTypeConfiguration<GoodsReceipt>
{
    public void Configure(EntityTypeBuilder<GoodsReceipt> builder)
    {
        builder.HasKey(g => g.Id);

        builder.Property(g => g.ReceiptCode)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(g => g.ReceiptCode)
            .IsUnique();

        builder.Property(g => g.SupplierName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(g => g.PoNumber)
            .HasMaxLength(100);

        builder.Property(g => g.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(g => g.TotalAmount)
            .HasColumnType("decimal(18,2)");

        builder.Property(g => g.Note)
            .HasMaxLength(500);

        builder.HasOne(g => g.CreatedByUser)
            .WithMany()
            .HasForeignKey(g => g.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(g => g.Items)
            .WithOne(i => i.GoodsReceipt)
            .HasForeignKey(i => i.GoodsReceiptId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(g => g.CreatedAt);
    }
}

public class GoodsReceiptItemConfiguration : IEntityTypeConfiguration<GoodsReceiptItem>
{
    public void Configure(EntityTypeBuilder<GoodsReceiptItem> builder)
    {
        builder.HasKey(i => i.Id);

        builder.Property(i => i.UnitPrice)
            .HasColumnType("decimal(18,2)");

        builder.Property(i => i.TotalPrice)
            .HasColumnType("decimal(18,2)");

        builder.Property(i => i.Note)
            .HasMaxLength(300);

        builder.HasOne(i => i.Material)
            .WithMany()
            .HasForeignKey(i => i.MaterialId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Location)
            .WithMany()
            .HasForeignKey(i => i.LocationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

