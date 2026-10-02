using Warehouse.Application.DTOs.Auth;
using Warehouse.Application.DTOs.Dashboard;
using Warehouse.Application.DTOs.GoodsReceipts;
using Warehouse.Application.DTOs.Inventory;
using Warehouse.Application.DTOs.Locations;
using Warehouse.Application.DTOs.Materials;
using Warehouse.Application.DTOs.Stock;
using Warehouse.Application.DTOs.Transactions;
using Warehouse.Application.DTOs.Users;
using Warehouse.Application.Models;

namespace Warehouse.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<UserProfileDto> GetCurrentUserProfileAsync();
    Task ChangePasswordAsync(ChangePasswordRequest request);
}

public interface IMaterialService
{
    Task<List<MaterialDto>> GetAllAsync(string? search = null, bool? onlyActive = null, bool? lowStockOnly = null);
    Task<MaterialDto> GetByIdAsync(int id);
    Task<MaterialDto> GetByCodeAsync(string materialCode);
    Task<MaterialStockSummaryDto> GetStockSummaryByCodeAsync(string materialCode);
    Task<MaterialDto> CreateAsync(CreateMaterialRequest request);
    Task<MaterialDto> UpdateAsync(int id, UpdateMaterialRequest request);
    Task<bool> DeleteAsync(int id);
}

public interface ILocationService
{
    Task<List<LocationDto>> GetAllAsync(string? rack = null, bool? onlyActive = null);
    Task<LocationDetailDto> GetByIdAsync(int id);
    Task<LocationDetailDto> GetByCodeAsync(string locationCode);
    Task<LocationDto> CreateAsync(CreateLocationRequest request);
    Task<LocationDto> UpdateAsync(int id, UpdateLocationRequest request);
    Task<bool> DeleteAsync(int id);
}

public interface IInventoryService
{
    Task<List<InventoryDto>> GetAllAsync(string? search = null, string? rack = null);
    Task<MaterialInventoryLookupDto> LookupByMaterialCodeAsync(string materialCode);
}

public interface IStockService
{
    Task<StockOperationResultDto> StockInAsync(StockInRequest request);
    Task<StockOperationResultDto> StockOutAsync(StockOutRequest request);
    Task<StockOperationResultDto> StockAdjustAsync(StockAdjustRequest request);
    Task<StockOperationResultDto> StockTransferAsync(StockTransferRequest request);
}

public interface ITransactionService
{
    Task<PagedResult<StockTransactionDto>> GetTransactionsAsync(TransactionFilterRequest filter);
    Task<StockTransactionDto> GetByIdAsync(int id);
    Task<byte[]> ExportToCsvAsync(TransactionFilterRequest filter);
}

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync();
}

public interface IUserService
{
    Task<List<UserDto>> GetAllUsersAsync();
    Task<UserDto> GetByIdAsync(int id);
    Task<UserDto> CreateUserAsync(CreateUserRequest request);
    Task<UserDto> UpdateUserAsync(int id, UpdateUserRequest request);
    Task<bool> DeleteUserAsync(int id);
}

public interface IGoodsReceiptService
{
    Task<PagedResult<GoodsReceiptDto>> GetAllAsync(GoodsReceiptFilterRequest filter);
    Task<GoodsReceiptDto> GetByIdAsync(int id);
    Task<GoodsReceiptDto> CreateAsync(CreateGoodsReceiptRequest request);
    Task<GoodsReceiptDto> CompleteReceiptAsync(int id);
    Task<bool> CancelReceiptAsync(int id);
}

