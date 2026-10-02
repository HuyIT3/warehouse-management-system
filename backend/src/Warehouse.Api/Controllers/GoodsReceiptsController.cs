using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.DTOs.GoodsReceipts;
using Warehouse.Application.Interfaces;
using Warehouse.Application.Models;

namespace Warehouse.Api.Controllers;

[Authorize(Policy = "WarehouseStaff")]
public class GoodsReceiptsController : BaseApiController
{
    private readonly IGoodsReceiptService _goodsReceiptService;

    public GoodsReceiptsController(IGoodsReceiptService goodsReceiptService)
    {
        _goodsReceiptService = goodsReceiptService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<GoodsReceiptDto>>>> GetGoodsReceipts([FromQuery] GoodsReceiptFilterRequest filter)
    {
        var result = await _goodsReceiptService.GetAllAsync(filter);
        return HandleResult(result, "Lấy danh sách phiếu nhập kho thành công.");
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<GoodsReceiptDto>>> GetById(int id)
    {
        var result = await _goodsReceiptService.GetByIdAsync(id);
        return HandleResult(result, $"Lấy chi tiết phiếu nhập kho #{id} thành công.");
    }

    [HttpPost]
    [Authorize(Policy = "InboundAccess")]
    public async Task<ActionResult<ApiResponse<GoodsReceiptDto>>> Create([FromBody] CreateGoodsReceiptRequest request)
    {
        var result = await _goodsReceiptService.CreateAsync(request);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<GoodsReceiptDto>.Ok(
                result,
                result.Status == Domain.Enums.GoodsReceiptStatus.COMPLETED
                    ? $"Tạo và nhập kho thành công phiếu '{result.ReceiptCode}'."
                    : $"Tạo bản nháp phiếu nhập kho '{result.ReceiptCode}' thành công."
            ));
    }

    [HttpPost("{id:int}/complete")]
    [Authorize(Policy = "InboundAccess")]
    public async Task<ActionResult<ApiResponse<GoodsReceiptDto>>> CompleteReceipt(int id)
    {
        var result = await _goodsReceiptService.CompleteReceiptAsync(id);
        return HandleResult(result, $"Hoàn tất nhập kho thành công cho phiếu '{result.ReceiptCode}'. Tồn kho đã được cập nhật.");
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "InboundAccess")]
    public async Task<ActionResult<ApiResponse<bool>>> CancelReceipt(int id)
    {
        var result = await _goodsReceiptService.CancelReceiptAsync(id);
        return HandleResult(result, "Hủy phiếu nhập kho thành công.");
    }
}
