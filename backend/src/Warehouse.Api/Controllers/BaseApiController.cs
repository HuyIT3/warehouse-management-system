using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.Models;

namespace Warehouse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected ActionResult<ApiResponse<T>> HandleResult<T>(T data, string message = "Success")
    {
        return Ok(ApiResponse<T>.Ok(data, message));
    }

    protected ActionResult<ApiResponse> HandleSuccess(string message = "Thao tác thành công")
    {
        return Ok(ApiResponse.Ok(message));
    }
}
