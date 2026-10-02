using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.DTOs.Dashboard;
using Warehouse.Application.Interfaces;
using Warehouse.Application.Models;

namespace Warehouse.Api.Controllers;

[Authorize]
public class DashboardController : BaseApiController
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    /// <summary>
    /// Lấy toàn bộ số liệu thống kê Dashboard thời gian thực
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<DashboardSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<DashboardSummaryDto>>> GetDashboardSummary()
    {
        var result = await _dashboardService.GetSummaryAsync();
        return HandleResult(result);
    }
}
