using System.Text;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.DTOs.Transactions;
using Warehouse.Application.Exceptions;
using Warehouse.Application.Interfaces;
using Warehouse.Application.Models;

namespace Warehouse.Application.Services;

public class TransactionService : ITransactionService
{
    private readonly IApplicationDbContext _context;

    public TransactionService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<StockTransactionDto>> GetTransactionsAsync(TransactionFilterRequest filter)
    {
        var query = _context.StockTransactions
            .Include(t => t.Material)
            .Include(t => t.Location)
            .Include(t => t.User)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.MaterialCode))
        {
            var code = filter.MaterialCode.Trim().ToLower();
            query = query.Where(t => t.Material.MaterialCode.ToLower().Contains(code) || t.Material.Name.ToLower().Contains(code));
        }

        if (!string.IsNullOrWhiteSpace(filter.LocationCode))
        {
            var loc = filter.LocationCode.Trim().ToLower();
            query = query.Where(t => t.Location.LocationCode.ToLower().Contains(loc) || t.Location.Rack.ToLower().Contains(loc));
        }

        if (filter.TransactionType.HasValue)
        {
            query = query.Where(t => t.TransactionType == filter.TransactionType.Value);
        }

        if (filter.UserId.HasValue)
        {
            query = query.Where(t => t.UserId == filter.UserId.Value);
        }

        if (filter.FromDate.HasValue)
        {
            query = query.Where(t => t.CreatedAt >= filter.FromDate.Value);
        }

        if (filter.ToDate.HasValue)
        {
            query = query.Where(t => t.CreatedAt <= filter.ToDate.Value);
        }

        var totalCount = await query.CountAsync();

        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new StockTransactionDto
            {
                Id = t.Id,
                InventoryId = t.InventoryId,
                MaterialId = t.MaterialId,
                MaterialCode = t.Material.MaterialCode,
                MaterialName = t.Material.Name,
                Unit = t.Material.Unit,
                LocationId = t.LocationId,
                LocationCode = t.Location.LocationCode,
                LocationDisplayName = t.Location.DisplayName,
                TransactionType = t.TransactionType,
                Quantity = t.Quantity,
                BeforeQuantity = t.BeforeQuantity,
                AfterQuantity = t.AfterQuantity,
                UserId = t.UserId,
                UserName = t.User.Username,
                UserFullName = t.User.FullName,
                Note = t.Note,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<StockTransactionDto>(items, totalCount, pageNumber, pageSize);
    }

    public async Task<StockTransactionDto> GetByIdAsync(int id)
    {
        var t = await _context.StockTransactions
            .Include(t => t.Material)
            .Include(t => t.Location)
            .Include(t => t.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id);

        if (t == null)
            throw new NotFoundException("Giao dịch kho", id);

        return new StockTransactionDto
        {
            Id = t.Id,
            InventoryId = t.InventoryId,
            MaterialId = t.MaterialId,
            MaterialCode = t.Material.MaterialCode,
            MaterialName = t.Material.Name,
            Unit = t.Material.Unit,
            LocationId = t.LocationId,
            LocationCode = t.Location.LocationCode,
            LocationDisplayName = t.Location.DisplayName,
            TransactionType = t.TransactionType,
            Quantity = t.Quantity,
            BeforeQuantity = t.BeforeQuantity,
            AfterQuantity = t.AfterQuantity,
            UserId = t.UserId,
            UserName = t.User.Username,
            UserFullName = t.User.FullName,
            Note = t.Note,
            CreatedAt = t.CreatedAt
        };
    }

    public async Task<byte[]> ExportToCsvAsync(TransactionFilterRequest filter)
    {
        filter.PageNumber = 1;
        filter.PageSize = 5000; // max export limit
        var result = await GetTransactionsAsync(filter);

        var sb = new StringBuilder();
        // UTF-8 BOM for Excel Vietnamese text display
        sb.AppendLine("Id,Thời gian,Loại GD,Mã vật tư,Tên vật tư,ĐVT,Vị trí,Số lượng,Trước GD,Sau GD,Người thực hiện,Ghi chú");

        foreach (var item in result.Items)
        {
            var formattedTime = item.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
            var cleanNote = item.Note?.Replace("\"", "\"\"") ?? "";
            var cleanName = item.MaterialName.Replace("\"", "\"\"");
            var cleanLoc = item.LocationDisplayName.Replace("\"", "\"\"");
            var cleanUser = item.UserFullName.Replace("\"", "\"\"");

            sb.AppendLine($"{item.Id},{formattedTime},{item.TransactionTypeName},{item.MaterialCode},\"{cleanName}\",{item.Unit},\"{cleanLoc}\",{item.Quantity},{item.BeforeQuantity},{item.AfterQuantity},\"{cleanUser}\",\"{cleanNote}\"");
        }

        var preamble = Encoding.UTF8.GetPreamble();
        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var fullBytes = new byte[preamble.Length + bytes.Length];
        Buffer.BlockCopy(preamble, 0, fullBytes, 0, preamble.Length);
        Buffer.BlockCopy(bytes, 0, fullBytes, preamble.Length, bytes.Length);

        return fullBytes;
    }
}
