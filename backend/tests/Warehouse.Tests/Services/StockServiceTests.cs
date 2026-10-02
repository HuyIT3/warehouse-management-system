using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Moq;
using Warehouse.Application.DTOs.Stock;
using Warehouse.Application.Exceptions;
using Warehouse.Application.Interfaces;
using Warehouse.Application.Services;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Infrastructure.Data;

namespace Warehouse.Tests.Services;

public class StockServiceTests
{
    private WarehouseDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<WarehouseDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        var context = new WarehouseDbContext(options);
        return context;
    }

    [Fact]
    public async Task StockOut_WhenSufficientStock_ShouldDeductQuantityAndRecordTransaction()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var currentUserServiceMock = new Mock<ICurrentUserService>();
        currentUserServiceMock.Setup(s => s.UserId).Returns(1);

        var user = new User { Id = 1, Username = "staff1", FullName = "Staff One", Role = UserRole.WAREHOUSE_STAFF };
        var material = new Material { Id = 1, MaterialCode = "VT001", Name = "Bu-lông M8", Unit = "Cái", MinStock = 20, IsActive = true };
        var location = new Location { Id = 1, LocationCode = "A01-01", Rack = "A", Level = 1, Slot = "01", IsActive = true };
        var inventory = new Inventory { Id = 1, MaterialId = 1, LocationId = 1, Quantity = 50 };

        context.Users.Add(user);
        context.Materials.Add(material);
        context.Locations.Add(location);
        context.Inventories.Add(inventory);
        await context.SaveChangesAsync();

        var stockService = new StockService(context, currentUserServiceMock.Object);

        var request = new StockOutRequest
        {
            MaterialCode = "VT001",
            LocationCode = "A01-01",
            Quantity = 10,
            Note = "Lắp ráp máy"
        };

        // Act
        var result = await stockService.StockOutAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.BeforeQuantity.Should().Be(50);
        result.AfterQuantity.Should().Be(40);
        result.QuantityChanged.Should().Be(10);
        result.RemainingTotalStock.Should().Be(40);

        var updatedInventory = await context.Inventories.FirstAsync(i => i.Id == 1);
        updatedInventory.Quantity.Should().Be(40);

        var tx = await context.StockTransactions.FirstOrDefaultAsync(t => t.TransactionType == TransactionType.OUT);
        tx.Should().NotBeNull();
        tx!.Quantity.Should().Be(10);
        tx.BeforeQuantity.Should().Be(50);
        tx.AfterQuantity.Should().Be(40);
        tx.UserId.Should().Be(1);
    }

    [Fact]
    public async Task StockOut_WhenInsufficientStock_ShouldThrowInsufficientStockException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var currentUserServiceMock = new Mock<ICurrentUserService>();
        currentUserServiceMock.Setup(s => s.UserId).Returns(1);

        var user = new User { Id = 1, Username = "staff1", FullName = "Staff One", Role = UserRole.WAREHOUSE_STAFF };
        var material = new Material { Id = 1, MaterialCode = "VT001", Name = "Bu-lông M8", Unit = "Cái", MinStock = 20, IsActive = true };
        var location = new Location { Id = 1, LocationCode = "A01-01", Rack = "A", Level = 1, Slot = "01", IsActive = true };
        var inventory = new Inventory { Id = 1, MaterialId = 1, LocationId = 1, Quantity = 5 };

        context.Users.Add(user);
        context.Materials.Add(material);
        context.Locations.Add(location);
        context.Inventories.Add(inventory);
        await context.SaveChangesAsync();

        var stockService = new StockService(context, currentUserServiceMock.Object);

        var request = new StockOutRequest
        {
            MaterialCode = "VT001",
            LocationCode = "A01-01",
            Quantity = 10
        };

        // Act & Assert
        var act = async () => await stockService.StockOutAsync(request);
        await act.Should().ThrowAsync<InsufficientStockException>();

        var unchangedInv = await context.Inventories.FirstAsync(i => i.Id == 1);
        unchangedInv.Quantity.Should().Be(5);
    }

    [Fact]
    public async Task StockIn_WhenValid_ShouldIncreaseStockAndRecordTransaction()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var currentUserServiceMock = new Mock<ICurrentUserService>();
        currentUserServiceMock.Setup(s => s.UserId).Returns(1);

        var user = new User { Id = 1, Username = "admin", FullName = "Admin", Role = UserRole.ADMIN };
        var material = new Material { Id = 1, MaterialCode = "VT001", Name = "Bu-lông M8", Unit = "Cái", MinStock = 20, IsActive = true };
        var location = new Location { Id = 1, LocationCode = "A01-01", Rack = "A", Level = 1, Slot = "01", IsActive = true };
        var inventory = new Inventory { Id = 1, MaterialId = 1, LocationId = 1, Quantity = 40 };

        context.Users.Add(user);
        context.Materials.Add(material);
        context.Locations.Add(location);
        context.Inventories.Add(inventory);
        await context.SaveChangesAsync();

        var stockService = new StockService(context, currentUserServiceMock.Object);

        var request = new StockInRequest
        {
            MaterialCode = "VT001",
            LocationCode = "A01-01",
            Quantity = 100,
            Note = "Nhập lô hàng mới"
        };

        // Act
        var result = await stockService.StockInAsync(request);

        // Assert
        result.Success.Should().BeTrue();
        result.BeforeQuantity.Should().Be(40);
        result.AfterQuantity.Should().Be(140);
        result.QuantityChanged.Should().Be(100);

        var updatedInventory = await context.Inventories.FirstAsync(i => i.Id == 1);
        updatedInventory.Quantity.Should().Be(140);

        var tx = await context.StockTransactions.FirstOrDefaultAsync(t => t.TransactionType == TransactionType.IN);
        tx.Should().NotBeNull();
        tx!.BeforeQuantity.Should().Be(40);
        tx.AfterQuantity.Should().Be(140);
    }

    [Fact]
    public async Task StockAdjust_WhenAudited_ShouldUpdateQuantityAndRecordDiff()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var currentUserServiceMock = new Mock<ICurrentUserService>();
        currentUserServiceMock.Setup(s => s.UserId).Returns(1);

        var user = new User { Id = 1, Username = "admin", FullName = "Admin", Role = UserRole.ADMIN };
        var material = new Material { Id = 1, MaterialCode = "VT001", Name = "Bu-lông M8", Unit = "Cái", MinStock = 20, IsActive = true };
        var location = new Location { Id = 1, LocationCode = "A01-01", Rack = "A", Level = 1, Slot = "01", IsActive = true };
        var inventory = new Inventory { Id = 1, MaterialId = 1, LocationId = 1, Quantity = 140 };

        context.Users.Add(user);
        context.Materials.Add(material);
        context.Locations.Add(location);
        context.Inventories.Add(inventory);
        await context.SaveChangesAsync();

        var stockService = new StockService(context, currentUserServiceMock.Object);

        var request = new StockAdjustRequest
        {
            MaterialCode = "VT001",
            LocationCode = "A01-01",
            ActualQuantity = 137,
            Reason = "Kiểm kê thực tế ngày 02/10/2026"
        };

        // Act
        var result = await stockService.StockAdjustAsync(request);

        // Assert
        result.Success.Should().BeTrue();
        result.BeforeQuantity.Should().Be(140);
        result.AfterQuantity.Should().Be(137);

        var updatedInventory = await context.Inventories.FirstAsync(i => i.Id == 1);
        updatedInventory.Quantity.Should().Be(137);

        var tx = await context.StockTransactions.FirstOrDefaultAsync(t => t.TransactionType == TransactionType.ADJUSTMENT);
        tx.Should().NotBeNull();
        tx!.Note.Should().Contain("Kiểm kê thực tế");
    }
}
