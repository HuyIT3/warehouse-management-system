using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.DTOs.Materials;
using Warehouse.Application.Interfaces;
using Warehouse.Application.Models;

namespace Warehouse.Api.Controllers;

[Authorize]
public class MaterialsController : BaseApiController
{
    private readonly IMaterialService _materialService;

    public MaterialsController(IMaterialService materialService)
    {
        _materialService = materialService;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ vật tư kèm tổng tồn kho
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<MaterialDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<MaterialDto>>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] bool? onlyActive,
        [FromQuery] bool? lowStockOnly)
    {
        var result = await _materialService.GetAllAsync(search, onlyActive, lowStockOnly);
        return HandleResult(result);
    }

    /// <summary>
    /// Lấy chi tiết vật tư theo ID
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<MaterialDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<MaterialDto>>> GetById(int id)
    {
        var result = await _materialService.GetByIdAsync(id);
        return HandleResult(result);
    }

    /// <summary>
    /// Lấy chi tiết vật tư theo Mã vật tư
    /// </summary>
    [HttpGet("code/{code}")]
    [ProducesResponseType(typeof(ApiResponse<MaterialDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<MaterialDto>>> GetByCode(string code)
    {
        var result = await _materialService.GetByCodeAsync(code);
        return HandleResult(result);
    }

    /// <summary>
    /// Tra cứu chi tiết phân bổ tồn kho của vật tư theo từng vị trí (Kệ/Tầng/Ô)
    /// </summary>
    [HttpGet("code/{code}/summary")]
    [ProducesResponseType(typeof(ApiResponse<MaterialStockSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MaterialStockSummaryDto>>> GetStockSummary(string code)
    {
        var result = await _materialService.GetStockSummaryByCodeAsync(code);
        return HandleResult(result);
    }

    /// <summary>
    /// Tạo mới vật tư (Admin, Manager, Inbound Staff)
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "InboundAccess")]
    [ProducesResponseType(typeof(ApiResponse<MaterialDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<MaterialDto>>> Create([FromBody] CreateMaterialRequest request)
    {
        var result = await _materialService.CreateAsync(request);
        return HandleResult(result, "Tạo mới vật tư thành công.");
    }

    /// <summary>
    /// Cập nhật thông tin vật tư (Admin, Manager, Inbound Staff)
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = "InboundAccess")]
    [ProducesResponseType(typeof(ApiResponse<MaterialDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MaterialDto>>> Update(int id, [FromBody] UpdateMaterialRequest request)
    {
        var result = await _materialService.UpdateAsync(id, request);
        return HandleResult(result, "Cập nhật vật tư thành công.");
    }

    /// <summary>
    /// Xóa hoặc vô hiệu hóa vật tư (Chỉ Admin)
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        await _materialService.DeleteAsync(id);
        return HandleSuccess("Xóa vật tư thành công.");
    }
}
