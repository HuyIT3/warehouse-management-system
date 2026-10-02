using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Moq;
using Warehouse.Application.DTOs.GoodsReceipts;
using Warehouse.Application.Exceptions;
using Warehouse.Application.Interfaces;
using Warehouse.Application.Services;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Infrastructure.Data;

namespace Warehouse.Tests.Services;

public class GoodsReceiptServiceTests
{
    private WarehouseDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<WarehouseDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new WarehouseDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_WhenAutoStockInTrue_ShouldCreateCompletedReceiptAndIncrementInventory()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var currentUserServiceMock = new Mock<ICurrentUserService>();
        currentUserServiceMock.Setup(s => s.UserId).Returns(1);

        var user = new User { Id = 1, Username = "inbound1", FullName = "Le Van Nhap", Role = UserRole.INBOUND_STAFF };
        var material = new Material { Id = 1, MaterialCode = "VT001", Name = "Bu-long M8", Unit = "Cai", MinStock = 20, IsActive = true };
        var location = new Location { Id = 1, LocationCode = "A01-01", Rack = "A", Level = 1, Slot = "01", IsActive = true };
        var inventory = new Inventory { Id = 1, MaterialId = 1, LocationId = 1, Quantity = 20 };

        context.Users.Add(user);
        context.Materials.Add(material);
        context.Locations.Add(location);
        context.Inventories.Add(inventory);
        await context.SaveChangesAsync();

        var service = new GoodsReceiptService(context, currentUserServiceMock.Object);

        var request = new CreateGoodsReceiptRequest
        {
            ReceiptCode = "NK-TEST-001",
            SupplierName = "NCC Test",
            PoNumber = "PO-001",
            Note = "Nhap hang test",
            AutoStockIn = true,
            Items = new List<CreateGoodsReceiptItemRequest>
            {
                new()
                {
                    MaterialId = 1,
                    LocationId = 1,
                    Quantity = 30,
                    UnitPrice = 10000,
                    Note = "Dòng 1"
                }
            }
        };

        // Act
        var result = await service.CreateAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.ReceiptCode.Should().Be("NK-TEST-001");
        result.Status.Should().Be(GoodsReceiptStatus.COMPLETED);
        result.TotalQuantity.Should().Be(30);
        result.TotalAmount.Should().Be(300000);

        var updatedInventory = await context.Inventories.FirstAsync(i => i.Id == 1);
        updatedInventory.Quantity.Should().Be(50); // 20 + 30

        var tx = await context.StockTransactions.FirstOrDefaultAsync(t => t.MaterialId == 1);
        tx.Should().NotBeNull();
        tx!.TransactionType.Should().Be(TransactionType.IN);
        tx.Quantity.Should().Be(30);
        tx.BeforeQuantity.Should().Be(20);
        tx.AfterQuantity.Should().Be(50);
    }

    [Fact]
    public async Task CreateAsync_WhenDraft_ShouldNotIncrementInventoryUntilCompleted()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var currentUserServiceMock = new Mock<ICurrentUserService>();
        currentUserServiceMock.Setup(s => s.UserId).Returns(1);

        var user = new User { Id = 1, Username = "inbound1", FullName = "Le Van Nhap", Role = UserRole.INBOUND_STAFF };
        var material = new Material { Id = 1, MaterialCode = "VT002", Name = "Dai oc M8", Unit = "Cai", MinStock = 10, IsActive = true };
        var location = new Location { Id = 1, LocationCode = "A01-02", Rack = "A", Level = 1, Slot = "02", IsActive = true };

        context.Users.Add(user);
        context.Materials.Add(material);
        context.Locations.Add(location);
        await context.SaveChangesAsync();

        var service = new GoodsReceiptService(context, currentUserServiceMock.Object);

        var request = new CreateGoodsReceiptRequest
        {
            ReceiptCode = "NK-DRAFT-001",
            SupplierName = "NCC Draft",
            AutoStockIn = false, // Draft mode
            Items = new List<CreateGoodsReceiptItemRequest>
            {
                new()
                {
                    MaterialId = 1,
                    LocationId = 1,
                    Quantity = 40,
                    UnitPrice = 5000
                }
            }
        };

        // Act - Create Draft
        var draftResult = await service.CreateAsync(request);

        // Assert Draft
        draftResult.Status.Should().Be(GoodsReceiptStatus.DRAFT);
        var invCount = await context.Inventories.CountAsync();
        invCount.Should().Be(0); // Not created/incremented yet

        // Act - Complete Draft
        var completedResult = await service.CompleteReceiptAsync(draftResult.Id);

        // Assert Completed
        completedResult.Status.Should().Be(GoodsReceiptStatus.COMPLETED);
        var updatedInv = await context.Inventories.FirstOrDefaultAsync(i => i.MaterialId == 1 && i.LocationId == 1);
        updatedInv.Should().NotBeNull();
        updatedInv!.Quantity.Should().Be(40);
    }

    [Fact]
    public async Task CancelReceipt_WhenCompleted_ShouldThrowValidationException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var currentUserServiceMock = new Mock<ICurrentUserService>();
        currentUserServiceMock.Setup(s => s.UserId).Returns(1);

        var receipt = new GoodsReceipt
        {
            Id = 10,
            ReceiptCode = "NK-COMP-01",
            SupplierName = "NCC A",
            Status = GoodsReceiptStatus.COMPLETED,
            CreatedByUserId = 1
        };
        context.GoodsReceipts.Add(receipt);
        await context.SaveChangesAsync();

        var service = new GoodsReceiptService(context, currentUserServiceMock.Object);

        // Act
        Func<Task> act = async () => await service.CancelReceiptAsync(10);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*Không thể hủy phiếu nhập kho đã hoàn tất*");
    }
}
