using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.DTOs.Users;
using Warehouse.Application.Interfaces;
using Warehouse.Application.Models;

namespace Warehouse.Api.Controllers;

[Authorize(Policy = "AdminOnly")]
public class UsersController : BaseApiController
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ người dùng hệ thống (Chỉ Admin)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<UserDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<UserDto>>>> GetAll()
    {
        var result = await _userService.GetAllUsersAsync();
        return HandleResult(result);
    }

    /// <summary>
    /// Lấy chi tiết thông tin người dùng theo ID (Chỉ Admin)
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetById(int id)
    {
        var result = await _userService.GetByIdAsync(id);
        return HandleResult(result);
    }

    /// <summary>
    /// Tạo tài khoản người dùng mới (Chỉ Admin)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<UserDto>>> Create([FromBody] CreateUserRequest request)
    {
        var result = await _userService.CreateUserAsync(request);
        return HandleResult(result, "Tạo tài khoản thành công.");
    }

    /// <summary>
    /// Cập nhật thông tin tài khoản người dùng (Chỉ Admin)
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<UserDto>>> Update(int id, [FromBody] UpdateUserRequest request)
    {
        var result = await _userService.UpdateUserAsync(id, request);
        return HandleResult(result, "Cập nhật tài khoản thành công.");
    }

    /// <summary>
    /// Vô hiệu hóa tài khoản người dùng (Chỉ Admin)
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        await _userService.DeleteUserAsync(id);
        return HandleSuccess("Vô hiệu hóa tài khoản thành công.");
    }
}
