using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Warehouse.Application.DTOs.Materials;
using Warehouse.Application.Exceptions;
using Warehouse.Application.Services;
using Warehouse.Domain.Entities;
using Warehouse.Infrastructure.Data;

namespace Warehouse.Tests.Services;

public class MaterialServiceTests
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
    public async Task CreateAsync_WhenDuplicateCode_ShouldThrowConflictException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        context.Materials.Add(new Material
        {
            MaterialCode = "VT001",
            Name = "Bu-lông M8",
            Unit = "Cái",
            MinStock = 20,
            IsActive = true
        });
        await context.SaveChangesAsync();

        var service = new MaterialService(context);

        var request = new CreateMaterialRequest
        {
            MaterialCode = "VT001",
            Name = "Bu-lông Trùng Mã",
            Unit = "Cái",
            MinStock = 10
        };

        // Act & Assert
        var act = async () => await service.CreateAsync(request);
        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task GetAllAsync_WithLowStockFilter_ShouldReturnOnlyDeficitMaterials()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var mat1 = new Material { Id = 1, MaterialCode = "VT001", Name = "Đủ tồn", Unit = "Cái", MinStock = 10, IsActive = true };
        var mat2 = new Material { Id = 2, MaterialCode = "VT002", Name = "Thiếu tồn", Unit = "Cái", MinStock = 50, IsActive = true };
        var loc = new Location { Id = 1, LocationCode = "A01", Rack = "A", Level = 1, Slot = "01", IsActive = true };

        var inv1 = new Inventory { MaterialId = 1, LocationId = 1, Quantity = 20 }; // 20 > 10 (OK)
        var inv2 = new Inventory { MaterialId = 2, LocationId = 1, Quantity = 15 }; // 15 <= 50 (Low Stock!)

        context.Materials.AddRange(mat1, mat2);
        context.Locations.Add(loc);
        context.Inventories.AddRange(inv1, inv2);
        await context.SaveChangesAsync();

        var service = new MaterialService(context);

        // Act
        var result = await service.GetAllAsync(lowStockOnly: true);

        // Assert
        result.Should().HaveCount(1);
        result[0].MaterialCode.Should().Be("VT002");
        result[0].IsLowStock.Should().BeTrue();
    }
}
