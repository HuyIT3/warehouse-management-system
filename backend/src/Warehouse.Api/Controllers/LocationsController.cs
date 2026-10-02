using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.DTOs.Locations;
using Warehouse.Application.Interfaces;
using Warehouse.Application.Models;

namespace Warehouse.Api.Controllers;

[Authorize]
public class LocationsController : BaseApiController
{
    private readonly ILocationService _locationService;

    public LocationsController(ILocationService locationService)
    {
        _locationService = locationService;
    }

    /// <summary>
    /// Lấy danh sách vị trí kho kèm thống kê vật tư lưu trữ
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<LocationDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<LocationDto>>>> GetAll(
        [FromQuery] string? rack,
        [FromQuery] bool? onlyActive)
    {
        var result = await _locationService.GetAllAsync(rack, onlyActive);
        return HandleResult(result);
    }

    /// <summary>
    /// Lấy chi tiết vị trí kho theo ID kèm danh sách vật tư bên trong
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<LocationDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<LocationDetailDto>>> GetById(int id)
    {
        var result = await _locationService.GetByIdAsync(id);
        return HandleResult(result);
    }

    /// <summary>
    /// Lấy chi tiết vị trí kho theo Mã vị trí
    /// </summary>
    [HttpGet("code/{code}")]
    [ProducesResponseType(typeof(ApiResponse<LocationDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<LocationDetailDto>>> GetByCode(string code)
    {
        var result = await _locationService.GetByCodeAsync(code);
        return HandleResult(result);
    }

    /// <summary>
    /// Tạo mới vị trí kho (Admin, Manager, Inbound Staff)
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "InboundAccess")]
    [ProducesResponseType(typeof(ApiResponse<LocationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<LocationDto>>> Create([FromBody] CreateLocationRequest request)
    {
        var result = await _locationService.CreateAsync(request);
        return HandleResult(result, "Tạo mới vị trí kho thành công.");
    }

    /// <summary>
    /// Cập nhật vị trí kho (Admin, Manager, Inbound Staff)
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = "InboundAccess")]
    [ProducesResponseType(typeof(ApiResponse<LocationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<LocationDto>>> Update(int id, [FromBody] UpdateLocationRequest request)
    {
        var result = await _locationService.UpdateAsync(id, request);
        return HandleResult(result, "Cập nhật vị trí kho thành công.");
    }

    /// <summary>
    /// Xóa hoặc vô hiệu hóa vị trí kho (Chỉ Admin)
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        await _locationService.DeleteAsync(id);
        return HandleSuccess("Xóa vị trí kho thành công.");
    }
}
