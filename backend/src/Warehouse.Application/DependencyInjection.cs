using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Warehouse.Application.Interfaces;
using Warehouse.Application.Services;

namespace Warehouse.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;

        services.AddValidatorsFromAssembly(assembly);

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IMaterialService, MaterialService>();
        services.AddScoped<ILocationService, LocationService>();
        services.AddScoped<IInventoryService, InventoryService>();
        services.AddScoped<IStockService, StockService>();
        services.AddScoped<ITransactionService, TransactionService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IGoodsReceiptService, GoodsReceiptService>();

        return services;
    }
}
