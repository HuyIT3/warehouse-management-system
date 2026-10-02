using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.DTOs.Inventory;
using Warehouse.Application.Interfaces;
using Warehouse.Application.Models;

namespace Warehouse.Api.Controllers;

[Authorize]
public class InventoryController : BaseApiController
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    /// <summary>
    /// Tra cứu toàn bộ tồn kho chi tiết theo từng ô/vị trí
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<InventoryDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<InventoryDto>>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? rack)
    {
        var result = await _inventoryService.GetAllAsync(search, rack);
        return HandleResult(result);
    }

    /// <summary>
    /// Tra cứu vị trí và số lượng tồn theo Mã vật tư (Dành cho Mobile Flow xuất/nhập nhanh)
    /// </summary>
    [HttpGet("lookup/{materialCode}")]
    [ProducesResponseType(typeof(ApiResponse<MaterialInventoryLookupDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<MaterialInventoryLookupDto>>> Lookup(string materialCode)
    {
        var result = await _inventoryService.LookupByMaterialCodeAsync(materialCode);
        return HandleResult(result, "Tra cứu tồn kho thành công.");
    }
}
