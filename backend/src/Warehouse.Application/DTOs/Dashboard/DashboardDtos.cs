using Warehouse.Domain.Enums;

namespace Warehouse.Application.DTOs.Dashboard;

public class DashboardSummaryDto
{
    public int TotalMaterials { get; set; }
    public int TotalInventoryQuantity { get; set; }
    public int TotalLowStockCount { get; set; }
    public int TotalLocations { get; set; }
    public int OccupiedLocationsCount { get; set; }

    public int TodayStockInQuantity { get; set; }
    public int TodayStockOutQuantity { get; set; }
    public int TodayTransactionsCount { get; set; }

    public List<LowStockItemDto> LowStockAlerts { get; set; } = new List<LowStockItemDto>();
    public List<RecentTransactionDto> RecentTransactions { get; set; } = new List<RecentTransactionDto>();
    public List<DailyActivityDto> Last7DaysActivity { get; set; } = new List<DailyActivityDto>();
}

public class LowStockItemDto
{
    public int MaterialId { get; set; }
    public string MaterialCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public int MinStock { get; set; }
    public int Deficit => MinStock - CurrentStock;
}

public class RecentTransactionDto
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public TransactionType Type { get; set; }
    public string MaterialCode { get; set; } = string.Empty;
    public string MaterialName { get; set; } = string.Empty;
    public string LocationCode { get; set; } = string.Empty;
    public string LocationDisplayName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int BeforeQuantity { get; set; }
    public int AfterQuantity { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class DailyActivityDto
{
    public string Date { get; set; } = string.Empty;
    public int InQuantity { get; set; }
    public int OutQuantity { get; set; }
}
