using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<WarehouseDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<WarehouseDbContext>>();

        try
        {
            await context.Database.EnsureCreatedAsync();

            if (await context.Users.AnyAsync())
            {
                // Already seeded
                return;
            }

            logger.LogInformation("Bắt đầu khởi tạo dữ liệu mẫu cho hệ thống kho WMS (Seeding DB)...");

            // 1. Seed Users for All Distinct Roles
            var adminUser = new User
            {
                Username = "admin",
                PasswordHash = passwordHasher.HashPassword("Admin@123"),
                FullName = "Quản Trị Viên Hệ Thống",
                Role = UserRole.ADMIN,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-30)
            };

            var managerUser = new User
            {
                Username = "manager",
                PasswordHash = passwordHasher.HashPassword("Manager@123"),
                FullName = "Nguyễn Trọng Quản (Quản lý kho)",
                Role = UserRole.MANAGER,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-28)
            };

            var inboundStaff = new User
            {
                Username = "inbound1",
                PasswordHash = passwordHasher.HashPassword("Staff@123"),
                FullName = "Lê Văn Nhập (NV Nhập kho)",
                Role = UserRole.INBOUND_STAFF,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-25)
            };

            var outboundStaff = new User
            {
                Username = "outbound1",
                PasswordHash = passwordHasher.HashPassword("Staff@123"),
                FullName = "Phạm Thị Xuất (NV Xuất kho)",
                Role = UserRole.OUTBOUND_STAFF,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-25)
            };

            var auditorStaff = new User
            {
                Username = "auditor1",
                PasswordHash = passwordHasher.HashPassword("Staff@123"),
                FullName = "Hoàng Minh Kiểm (NV Kiểm kê)",
                Role = UserRole.AUDITOR,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-20)
            };

            var warehouseStaff = new User
            {
                Username = "staff1",
                PasswordHash = passwordHasher.HashPassword("Staff@123"),
                FullName = "Nguyễn Văn An (NV Kho tổng hợp)",
                Role = UserRole.WAREHOUSE_STAFF,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-20)
            };

            context.Users.AddRange(adminUser, managerUser, inboundStaff, outboundStaff, auditorStaff, warehouseStaff);
            await context.SaveChangesAsync();

            // 2. Seed Locations (Racks A, B, C)
            var locations = new List<Location>
            {
                new() { LocationCode = "A01-01", Rack = "A", Level = 1, Slot = "01", Description = "Khu vực linh kiện kim khí tầng 1", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { LocationCode = "A01-02", Rack = "A", Level = 1, Slot = "02", Description = "Khu vực linh kiện kim khí tầng 1", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { LocationCode = "A01-03", Rack = "A", Level = 1, Slot = "03", Description = "Khu vực linh kiện kim khí tầng 1", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { LocationCode = "A02-01", Rack = "A", Level = 2, Slot = "01", Description = "Khu vực thiết bị điện tầng 2", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { LocationCode = "A02-02", Rack = "A", Level = 2, Slot = "02", Description = "Khu vực thiết bị điện tầng 2", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { LocationCode = "A02-03", Rack = "A", Level = 2, Slot = "03", Description = "Khu vực thiết bị điện tầng 2", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { LocationCode = "B01-01", Rack = "B", Level = 1, Slot = "01", Description = "Khu vực vật tư phụ tầng 1", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { LocationCode = "B01-02", Rack = "B", Level = 1, Slot = "02", Description = "Khu vực vật tư phụ tầng 1", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { LocationCode = "B01-03", Rack = "B", Level = 1, Slot = "03", Description = "Khu vực vật tư phụ tầng 1", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { LocationCode = "B02-01", Rack = "B", Level = 2, Slot = "01", Description = "Khu vực tự động hóa tầng 2", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { LocationCode = "B02-02", Rack = "B", Level = 2, Slot = "02", Description = "Khu vực tự động hóa tầng 2", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { LocationCode = "B02-03", Rack = "B", Level = 2, Slot = "03", Description = "Khu vực phụ tư hóa chất tầng 2", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { LocationCode = "C01-01", Rack = "C", Level = 1, Slot = "01", Description = "Khu vực kim loại nặng tầng 1", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { LocationCode = "C01-02", Rack = "C", Level = 1, Slot = "02", Description = "Khu vực kim loại nặng tầng 1", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { LocationCode = "C02-01", Rack = "C", Level = 2, Slot = "01", Description = "Khu vực vật liệu xây dựng tầng 2", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) }
            };

            context.Locations.AddRange(locations);
            await context.SaveChangesAsync();

            // 3. Seed Materials
            var materials = new List<Material>
            {
                new() { MaterialCode = "VT001", Name = "Bu-lông Inox M8 x 30mm", Unit = "Cái", MinStock = 20, Category = "Kim khí", Description = "Bu-lông lục giác ngoài inox 304 tiêu chuẩn DIN 933", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { MaterialCode = "VT002", Name = "Đai ốc Inox M8", Unit = "Cái", MinStock = 20, Category = "Kim khí", Description = "Đai ốc lục giác inox 304 tiêu chuẩn DIN 934", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { MaterialCode = "VT003", Name = "Dây cáp điện Cadivi 2.5mm²", Unit = "Mét", MinStock = 50, Category = "Thiết bị điện", Description = "Dây điện đồng đơn mềm ruột nhiều sợi", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { MaterialCode = "VT004", Name = "Ống thép đúc phi D27 dày 2.5mm", Unit = "Cây", MinStock = 15, Category = "Kim loại", Description = "Ống thép mạ kẽm chiều dài tiêu chuẩn 6m", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { MaterialCode = "VT005", Name = "Khởi động từ Contactor 3P 220V 25A", Unit = "Bộ", MinStock = 5, Category = "Thiết bị điện", Description = "Contactor Schneider LC1D25M7 220V", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { MaterialCode = "VT006", Name = "Aptomat tép MCB 2P 32A 6kA", Unit = "Cái", MinStock = 10, Category = "Thiết bị điện", Description = "Aptomat bảo vệ quá tải và ngắn mạch Panasonic", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { MaterialCode = "VT007", Name = "Cảm biến quang điện tử NPN Omron", Unit = "Cái", MinStock = 8, Category = "Tự động hóa", Description = "Cảm biến thu phát quang học E3Z-T61 2M", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new() { MaterialCode = "VT008", Name = "Băng keo chịu nhiệt 3M 50mm x 33m", Unit = "Cuộn", MinStock = 25, Category = "Vật tư phụ", Description = "Băng keo silicone cách nhiệt chống cháy chất lượng cao", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) }
            };

            context.Materials.AddRange(materials);
            await context.SaveChangesAsync();

            // 4. Seed Inventories (Material in specific locations)
            var locMap = locations.ToDictionary(l => l.LocationCode, l => l.Id);
            var matMap = materials.ToDictionary(m => m.MaterialCode, m => m.Id);

            var inventories = new List<Inventory>
            {
                // VT001: 50 in A01-01, 30 in A01-02, 20 in B01-01 (Total: 100)
                new() { MaterialId = matMap["VT001"], LocationId = locMap["A01-01"], Quantity = 50, CreatedAt = DateTime.UtcNow.AddDays(-25), UpdatedAt = DateTime.UtcNow.AddDays(-5) },
                new() { MaterialId = matMap["VT001"], LocationId = locMap["A01-02"], Quantity = 30, CreatedAt = DateTime.UtcNow.AddDays(-25), UpdatedAt = DateTime.UtcNow.AddDays(-4) },
                new() { MaterialId = matMap["VT001"], LocationId = locMap["B01-01"], Quantity = 20, CreatedAt = DateTime.UtcNow.AddDays(-20), UpdatedAt = DateTime.UtcNow.AddDays(-2) },

                // VT002: 80 in A01-03, 40 in B01-02 (Total: 120)
                new() { MaterialId = matMap["VT002"], LocationId = locMap["A01-03"], Quantity = 80, CreatedAt = DateTime.UtcNow.AddDays(-25), UpdatedAt = DateTime.UtcNow.AddDays(-8) },
                new() { MaterialId = matMap["VT002"], LocationId = locMap["B01-02"], Quantity = 40, CreatedAt = DateTime.UtcNow.AddDays(-20), UpdatedAt = DateTime.UtcNow.AddDays(-3) },

                // VT003: 15 in A02-01, 10 in B02-01 (Total: 25 -> Low Stock alert since min=50)
                new() { MaterialId = matMap["VT003"], LocationId = locMap["A02-01"], Quantity = 15, CreatedAt = DateTime.UtcNow.AddDays(-25), UpdatedAt = DateTime.UtcNow.AddDays(-1) },
                new() { MaterialId = matMap["VT003"], LocationId = locMap["B02-01"], Quantity = 10, CreatedAt = DateTime.UtcNow.AddDays(-20), UpdatedAt = DateTime.UtcNow.AddDays(-2) },

                // VT004: 8 in C01-01 (Total: 8 -> Low Stock alert since min=15)
                new() { MaterialId = matMap["VT004"], LocationId = locMap["C01-01"], Quantity = 8, CreatedAt = DateTime.UtcNow.AddDays(-25), UpdatedAt = DateTime.UtcNow.AddDays(-10) },

                // VT005: 12 in A02-02 (Total: 12)
                new() { MaterialId = matMap["VT005"], LocationId = locMap["A02-02"], Quantity = 12, CreatedAt = DateTime.UtcNow.AddDays(-20), UpdatedAt = DateTime.UtcNow.AddDays(-6) },

                // VT006: 18 in A02-03 (Total: 18)
                new() { MaterialId = matMap["VT006"], LocationId = locMap["A02-03"], Quantity = 18, CreatedAt = DateTime.UtcNow.AddDays(-20), UpdatedAt = DateTime.UtcNow.AddDays(-4) },

                // VT007: 4 in B02-02 (Total: 4 -> Low Stock alert since min=8)
                new() { MaterialId = matMap["VT007"], LocationId = locMap["B02-02"], Quantity = 4, CreatedAt = DateTime.UtcNow.AddDays(-20), UpdatedAt = DateTime.UtcNow.AddDays(-2) },

                // VT008: 45 in B02-03 (Total: 45)
                new() { MaterialId = matMap["VT008"], LocationId = locMap["B02-03"], Quantity = 45, CreatedAt = DateTime.UtcNow.AddDays(-20), UpdatedAt = DateTime.UtcNow.AddDays(-5) }
            };

            context.Inventories.AddRange(inventories);
            await context.SaveChangesAsync();

            // 5. Seed Goods Receipts (Phiếu Nhập Kho)
            var receipt1 = new GoodsReceipt
            {
                ReceiptCode = "NK-202610-001",
                SupplierName = "Công ty TNHH Kim Khí Toàn Thắng",
                PoNumber = "PO-2026-101",
                Status = GoodsReceiptStatus.COMPLETED,
                TotalQuantity = 140,
                TotalAmount = 1860000,
                Note = "Nhập lô bu-lông và đai ốc định kỳ phục vụ dây chuyền sản xuất",
                CreatedByUserId = inboundStaff.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                CompletedAt = DateTime.UtcNow.AddDays(-5),
                Items = new List<GoodsReceiptItem>
                {
                    new()
                    {
                        MaterialId = matMap["VT001"],
                        LocationId = locMap["A01-01"],
                        Quantity = 60,
                        UnitPrice = 15000,
                        TotalPrice = 900000,
                        Note = "Đã kiểm đếm đầy đủ 60 cái tiêu chuẩn DIN 933"
                    },
                    new()
                    {
                        MaterialId = matMap["VT002"],
                        LocationId = locMap["A01-03"],
                        Quantity = 80,
                        UnitPrice = 12000,
                        TotalPrice = 960000,
                        Note = "Đai ốc M8 đóng túi 80 chiếc"
                    }
                }
            };

            var receipt2 = new GoodsReceipt
            {
                ReceiptCode = "NK-202610-002",
                SupplierName = "Công ty CP Thiết Bị Điện Cadivi Miền Bắc",
                PoNumber = "PO-2026-105",
                Status = GoodsReceiptStatus.COMPLETED,
                TotalQuantity = 47,
                TotalAmount = 5415000,
                Note = "Nhập vật tư điện điều khiển công trình nhà xưởng B",
                CreatedByUserId = inboundStaff.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-3),
                CompletedAt = DateTime.UtcNow.AddDays(-3),
                Items = new List<GoodsReceiptItem>
                {
                    new()
                    {
                        MaterialId = matMap["VT003"],
                        LocationId = locMap["A02-01"],
                        Quantity = 35,
                        UnitPrice = 45000,
                        TotalPrice = 1575000,
                        Note = "Dây điện 2.5 cuộn 35m"
                    },
                    new()
                    {
                        MaterialId = matMap["VT005"],
                        LocationId = locMap["A02-02"],
                        Quantity = 12,
                        UnitPrice = 320000,
                        TotalPrice = 3840000,
                        Note = "Contactor Schneider nguyên hộp tem bảo hành"
                    }
                }
            };

            var receipt3 = new GoodsReceipt
            {
                ReceiptCode = "NK-202610-003",
                SupplierName = "Công ty TNHH Tự Động Hóa Omron Việt Nam",
                PoNumber = "PO-2026-120",
                Status = GoodsReceiptStatus.DRAFT,
                TotalQuantity = 10,
                TotalAmount = 8500000,
                Note = "Đang chờ bộ phận KCS kiểm tra thông số kỹ thuật cảm biến",
                CreatedByUserId = managerUser.Id,
                CreatedAt = DateTime.UtcNow.AddHours(-6),
                CompletedAt = null,
                Items = new List<GoodsReceiptItem>
                {
                    new()
                    {
                        MaterialId = matMap["VT007"],
                        LocationId = locMap["B02-02"],
                        Quantity = 10,
                        UnitPrice = 850000,
                        TotalPrice = 8500000,
                        Note = "Lô cảm biến quang E3Z-T61 kiểm hàng tại cửa nhập số 2"
                    }
                }
            };

            context.GoodsReceipts.AddRange(receipt1, receipt2, receipt3);
            await context.SaveChangesAsync();

            // 6. Seed Realistic Historical Stock Transactions
            var invA01_01_VT001 = inventories.First(i => i.MaterialId == matMap["VT001"] && i.LocationId == locMap["A01-01"]);
            var invA02_01_VT003 = inventories.First(i => i.MaterialId == matMap["VT003"] && i.LocationId == locMap["A02-01"]);
            var invC01_01_VT004 = inventories.First(i => i.MaterialId == matMap["VT004"] && i.LocationId == locMap["C01-01"]);

            var transactions = new List<StockTransaction>
            {
                new()
                {
                    InventoryId = invA01_01_VT001.Id,
                    MaterialId = matMap["VT001"],
                    LocationId = locMap["A01-01"],
                    TransactionType = TransactionType.IN,
                    Quantity = 60,
                    BeforeQuantity = 0,
                    AfterQuantity = 60,
                    UserId = inboundStaff.Id,
                    Note = "[Nhập kho theo phiếu NK-202610-001] Bu-lông Inox M8 x 30mm từ NCC: Công ty TNHH Kim Khí Toàn Thắng",
                    CreatedAt = DateTime.UtcNow.AddDays(-5)
                },
                new()
                {
                    InventoryId = invA01_01_VT001.Id,
                    MaterialId = matMap["VT001"],
                    LocationId = locMap["A01-01"],
                    TransactionType = TransactionType.OUT,
                    Quantity = 10,
                    BeforeQuantity = 60,
                    AfterQuantity = 50,
                    UserId = outboundStaff.Id,
                    Note = "Xuất lắp ráp máy chuyền sản xuất #3 (Yêu cầu XK-2026-004)",
                    CreatedAt = DateTime.UtcNow.AddHours(-3)
                },
                new()
                {
                    InventoryId = invA02_01_VT003.Id,
                    MaterialId = matMap["VT003"],
                    LocationId = locMap["A02-01"],
                    TransactionType = TransactionType.IN,
                    Quantity = 35,
                    BeforeQuantity = 0,
                    AfterQuantity = 35,
                    UserId = inboundStaff.Id,
                    Note = "[Nhập kho theo phiếu NK-202610-002] Dây cáp điện Cadivi 2.5mm² từ NCC: Công ty CP Thiết Bị Điện Cadivi",
                    CreatedAt = DateTime.UtcNow.AddDays(-3)
                },
                new()
                {
                    InventoryId = invA02_01_VT003.Id,
                    MaterialId = matMap["VT003"],
                    LocationId = locMap["A02-01"],
                    TransactionType = TransactionType.OUT,
                    Quantity = 20,
                    BeforeQuantity = 35,
                    AfterQuantity = 15,
                    UserId = outboundStaff.Id,
                    Note = "Xuất thi công tủ điện trung tâm tầng 2",
                    CreatedAt = DateTime.UtcNow.AddHours(-1)
                },
                new()
                {
                    InventoryId = invC01_01_VT004.Id,
                    MaterialId = matMap["VT004"],
                    LocationId = locMap["C01-01"],
                    TransactionType = TransactionType.ADJUSTMENT,
                    Quantity = 2,
                    BeforeQuantity = 10,
                    AfterQuantity = 8,
                    UserId = auditorStaff.Id,
                    Note = "[Kiểm kê điều chỉnh] Hao hụt thực tế kiểm kê cuối tháng (Chênh lệch: -2)",
                    CreatedAt = DateTime.UtcNow.AddHours(-5)
                }
            };

            context.StockTransactions.AddRange(transactions);
            await context.SaveChangesAsync();

            logger.LogInformation("Khởi tạo dữ liệu mẫu hoàn tất thành công với đầy đủ các vai trò và phiếu nhập kho!");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi xảy ra trong quá trình seed database.");
        }
    }
}
