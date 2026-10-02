using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.DTOs.Transactions;
using Warehouse.Application.Interfaces;
using Warehouse.Application.Models;

namespace Warehouse.Api.Controllers;

[Authorize]
public class TransactionsController : BaseApiController
{
    private readonly ITransactionService _transactionService;

    public TransactionsController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    /// <summary>
    /// Tra cứu lịch sử biến động kho (Audit Trail) có phân trang và lọc
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<StockTransactionDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResult<StockTransactionDto>>>> GetTransactions(
        [FromQuery] TransactionFilterRequest filter)
    {
        var result = await _transactionService.GetTransactionsAsync(filter);
        return HandleResult(result);
    }

    /// <summary>
    /// Lấy chi tiết một giao dịch kho theo ID
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<StockTransactionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<StockTransactionDto>>> GetById(int id)
    {
        var result = await _transactionService.GetByIdAsync(id);
        return HandleResult(result);
    }

    /// <summary>
    /// Xuất file CSV lịch sử giao dịch kho
    /// </summary>
    [HttpGet("export-csv")]
    public async Task<IActionResult> ExportCsv([FromQuery] TransactionFilterRequest filter)
    {
        var bytes = await _transactionService.ExportToCsvAsync(filter);
        var fileName = $"Warehouse_Transactions_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
        return File(bytes, "text/csv; charset=utf-8", fileName);
    }
}
