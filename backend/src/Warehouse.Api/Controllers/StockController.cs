using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.DTOs.Stock;
using Warehouse.Application.Interfaces;
using Warehouse.Application.Models;

namespace Warehouse.Api.Controllers;

[Authorize]
public class StockController : BaseApiController
{
    private readonly IStockService _stockService;

    public StockController(IStockService stockService)
    {
        _stockService = stockService;
    }

    /// <summary>
    /// Xuất vật tư khỏi kho (Workflow chính cho nhân viên kho)
    /// </summary>
    [HttpPost("out")]
    [ProducesResponseType(typeof(ApiResponse<StockOperationResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<StockOperationResultDto>>> StockOut([FromBody] StockOutRequest request)
    {
        var result = await _stockService.StockOutAsync(request);
        return HandleResult(result, result.Message);
    }

    /// <summary>
    /// Nhập vật tư vào kho
    /// </summary>
    [HttpPost("in")]
    [ProducesResponseType(typeof(ApiResponse<StockOperationResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<StockOperationResultDto>>> StockIn([FromBody] StockInRequest request)
    {
        var result = await _stockService.StockInAsync(request);
        return HandleResult(result, result.Message);
    }

    /// <summary>
    /// Điều chỉnh số lượng tồn kho theo kiểm kê thực tế (Bắt buộc lý do kiểm toán)
    /// </summary>
    [HttpPost("adjust")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(ApiResponse<StockOperationResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<StockOperationResultDto>>> StockAdjust([FromBody] StockAdjustRequest request)
    {
        var result = await _stockService.StockAdjustAsync(request);
        return HandleResult(result, result.Message);
    }

    /// <summary>
    /// Chuyển vị trí vật tư từ ô này sang ô khác
    /// </summary>
    [HttpPost("transfer")]
    [ProducesResponseType(typeof(ApiResponse<StockOperationResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<StockOperationResultDto>>> StockTransfer([FromBody] StockTransferRequest request)
    {
        var result = await _stockService.StockTransferAsync(request);
        return HandleResult(result, result.Message);
    }
}
