using System.Net;
using System.Text.Json;
using Warehouse.Application.Exceptions;
using Warehouse.Application.Models;
using Warehouse.Domain.Exceptions;

namespace Warehouse.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var statusCode = HttpStatusCode.InternalServerError;
        var response = new ApiResponse();
        var errors = new List<string>();

        switch (exception)
        {
            case ValidationException valEx:
                statusCode = HttpStatusCode.BadRequest;
                response.Message = valEx.Message;
                foreach (var err in valEx.Errors)
                {
                    errors.AddRange(err.Value.Select(msg => $"{err.Key}: {msg}"));
                }
                _logger.LogWarning("Validation failed: {Errors}", string.Join(", ", errors));
                break;

            case InsufficientStockException stockEx:
                statusCode = HttpStatusCode.BadRequest;
                response.Message = stockEx.Message;
                errors.Add($"Vật tư '{stockEx.MaterialCode}' tại '{stockEx.LocationCode}': Tồn hiện tại {stockEx.AvailableQuantity}, yêu cầu {stockEx.RequestedQuantity}");
                _logger.LogWarning("Insufficient stock: {Message}", stockEx.Message);
                break;

            case DomainException domEx:
                statusCode = HttpStatusCode.BadRequest;
                response.Message = domEx.Message;
                errors.Add(domEx.Message);
                _logger.LogWarning("Domain exception: {Message}", domEx.Message);
                break;

            case NotFoundException nfEx:
                statusCode = HttpStatusCode.NotFound;
                response.Message = nfEx.Message;
                errors.Add(nfEx.Message);
                _logger.LogWarning("Resource not found: {Message}", nfEx.Message);
                break;

            case UnauthorizedException unAuthEx:
                statusCode = HttpStatusCode.Unauthorized;
                response.Message = unAuthEx.Message;
                errors.Add(unAuthEx.Message);
                _logger.LogWarning("Unauthorized access: {Message}", unAuthEx.Message);
                break;

            case ConflictException confEx:
                statusCode = HttpStatusCode.Conflict;
                response.Message = confEx.Message;
                errors.Add(confEx.Message);
                _logger.LogWarning("Conflict: {Message}", confEx.Message);
                break;

            default:
                statusCode = HttpStatusCode.InternalServerError;
                response.Message = "Đã xảy ra lỗi máy chủ không mong muốn. Vui lòng thử lại sau.";
                errors.Add(exception.Message);
                _logger.LogError(exception, "Unhandled system exception: {Message}", exception.Message);
                break;
        }

        response.Success = false;
        response.Errors = errors.Count > 0 ? errors : new List<string> { response.Message };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
