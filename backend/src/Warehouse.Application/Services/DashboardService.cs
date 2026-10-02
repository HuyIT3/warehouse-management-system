using Microsoft.EntityFrameworkCore;
using Warehouse.Application.DTOs.Dashboard;
using Warehouse.Application.Interfaces;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IApplicationDbContext _context;

    public DashboardService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync()
    {
        var now = DateTime.UtcNow;
        var todayStart = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);
        var sevenDaysAgo = todayStart.AddDays(-6);

        var totalMaterials = await _context.Materials.CountAsync(m => m.IsActive);
        var totalLocations = await _context.Locations.CountAsync(l => l.IsActive);

        var inventories = await _context.Inventories
            .Include(i => i.Material)
            .AsNoTracking()
            .ToListAsync();

        var totalInventoryQuantity = inventories.Sum(i => i.Quantity);
        var occupiedLocationsCount = inventories
            .Where(i => i.Quantity > 0)
            .Select(i => i.LocationId)
            .Distinct()
            .Count();

        // Calculate low stock materials
        var materials = await _context.Materials
            .Include(m => m.Inventories)
            .Where(m => m.IsActive)
            .AsNoTracking()
            .ToListAsync();

        var lowStockAlerts = materials
            .Select(m => new
            {
                Material = m,
                CurrentStock = m.Inventories.Sum(i => i.Quantity)
            })
            .Where(x => x.CurrentStock <= x.Material.MinStock)
            .OrderBy(x => x.CurrentStock)
            .Select(x => new LowStockItemDto
            {
                MaterialId = x.Material.Id,
                MaterialCode = x.Material.MaterialCode,
                Name = x.Material.Name,
                Unit = x.Material.Unit,
                CurrentStock = x.CurrentStock,
                MinStock = x.Material.MinStock
            })
            .Take(10)
            .ToList();

        var totalLowStockCount = materials.Count(m => m.Inventories.Sum(i => i.Quantity) <= m.MinStock);

        // Today stats
        var todayTransactions = await _context.StockTransactions
            .Where(t => t.CreatedAt >= todayStart)
            .AsNoTracking()
            .ToListAsync();

        var todayIn = todayTransactions
            .Where(t => t.TransactionType == TransactionType.IN)
            .Sum(t => t.Quantity);

        var todayOut = todayTransactions
            .Where(t => t.TransactionType == TransactionType.OUT)
            .Sum(t => t.Quantity);

        var todayTxCount = todayTransactions.Count;

        // Recent 10 transactions
        var recent = await _context.StockTransactions
            .Include(t => t.Material)
            .Include(t => t.Location)
            .Include(t => t.User)
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .Select(t => new RecentTransactionDto
            {
                Id = t.Id,
                CreatedAt = t.CreatedAt,
                Type = t.TransactionType,
                MaterialCode = t.Material.MaterialCode,
                MaterialName = t.Material.Name,
                LocationCode = t.Location.LocationCode,
                LocationDisplayName = t.Location.DisplayName,
                Quantity = t.Quantity,
                BeforeQuantity = t.BeforeQuantity,
                AfterQuantity = t.AfterQuantity,
                UserFullName = t.User.FullName,
                Note = t.Note
            })
            .ToListAsync();

        // 7 days activity
        var past7DaysTxs = await _context.StockTransactions
            .Where(t => t.CreatedAt >= sevenDaysAgo)
            .AsNoTracking()
            .ToListAsync();

        var last7DaysActivity = new List<DailyActivityDto>();
        for (int i = 6; i >= 0; i--)
        {
            var day = todayStart.AddDays(-i);
            var nextDay = day.AddDays(1);
            var dayTxs = past7DaysTxs.Where(t => t.CreatedAt >= day && t.CreatedAt < nextDay).ToList();

            last7DaysActivity.Add(new DailyActivityDto
            {
                Date = day.ToString("dd/MM"),
                InQuantity = dayTxs.Where(t => t.TransactionType == TransactionType.IN).Sum(t => t.Quantity),
                OutQuantity = dayTxs.Where(t => t.TransactionType == TransactionType.OUT).Sum(t => t.Quantity)
            });
        }

        return new DashboardSummaryDto
        {
            TotalMaterials = totalMaterials,
            TotalInventoryQuantity = totalInventoryQuantity,
            TotalLowStockCount = totalLowStockCount,
            TotalLocations = totalLocations,
            OccupiedLocationsCount = occupiedLocationsCount,
            TodayStockInQuantity = todayIn,
            TodayStockOutQuantity = todayOut,
            TodayTransactionsCount = todayTxCount,
            LowStockAlerts = lowStockAlerts,
            RecentTransactions = recent,
            Last7DaysActivity = last7DaysActivity
        };
    }
}
