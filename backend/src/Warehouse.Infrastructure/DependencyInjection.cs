using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Warehouse.Application.Interfaces;
using Warehouse.Infrastructure.Data;
using Warehouse.Infrastructure.Services;

namespace Warehouse.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var dbProvider = configuration["DatabaseProvider"] ?? "Sqlite";
        var sqlServerConnection = configuration.GetConnectionString("SqlServerConnection")
            ?? "Server=(localdb)\\mssqllocaldb;Database=WarehouseDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";
        var mySqlConnection = configuration.GetConnectionString("MySqlConnection")
            ?? "Server=localhost;Port=3306;Database=warehouse_db;User=root;Password=root_password;CharSet=utf8mb4;";
        var postgreSqlConnection = configuration.GetConnectionString("PostgreSqlConnection")
            ?? "Host=localhost;Port=5432;Database=warehouse_db;Username=postgres;Password=postgres_password;";
        var sqliteConnection = configuration.GetConnectionString("SqliteConnection")
            ?? "Data Source=warehouse.db";

        if (string.Equals(dbProvider, "MySql", StringComparison.OrdinalIgnoreCase))
        {
            var serverVersion = new MySqlServerVersion(new Version(8, 0, 36));
            services.AddDbContext<WarehouseDbContext>(options =>
                options.UseMySql(mySqlConnection, serverVersion, b => b.MigrationsAssembly(typeof(WarehouseDbContext).Assembly.FullName)));
        }
        else if (string.Equals(dbProvider, "PostgreSql", StringComparison.OrdinalIgnoreCase) || string.Equals(dbProvider, "Postgres", StringComparison.OrdinalIgnoreCase))
        {
            services.AddDbContext<WarehouseDbContext>(options =>
                options.UseNpgsql(postgreSqlConnection, b => b.MigrationsAssembly(typeof(WarehouseDbContext).Assembly.FullName)));
        }
        else if (string.Equals(dbProvider, "SqlServer", StringComparison.OrdinalIgnoreCase))
        {
            services.AddDbContext<WarehouseDbContext>(options =>
                options.UseSqlServer(sqlServerConnection, b => b.MigrationsAssembly(typeof(WarehouseDbContext).Assembly.FullName)));
        }
        else
        {
            services.AddDbContext<WarehouseDbContext>(options =>
                options.UseSqlite(sqliteConnection, b => b.MigrationsAssembly(typeof(WarehouseDbContext).Assembly.FullName)));
        }

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<WarehouseDbContext>());

        // Security & User Services
        services.AddHttpContextAccessor();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        // JWT Authentication Configuration
        var jwtSecret = configuration["Jwt:Secret"] ?? "WarehouseManagement_SecretKey_Minimum_32_Characters_Required!";
        var jwtIssuer = configuration["Jwt:Issuer"] ?? "WarehouseManagementApi";
        var jwtAudience = configuration["Jwt:Audience"] ?? "WarehouseManagementApp";

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,
                ValidateAudience = true,
                ValidAudience = jwtAudience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

        services.AddAuthorization(options =>
        {
            options.AddPolicy("AdminOnly", policy => policy.RequireRole("ADMIN"));
            options.AddPolicy("ManagerOrAdmin", policy => policy.RequireRole("ADMIN", "MANAGER"));
            options.AddPolicy("InboundAccess", policy => policy.RequireRole("ADMIN", "MANAGER", "INBOUND_STAFF", "WAREHOUSE_STAFF"));
            options.AddPolicy("OutboundAccess", policy => policy.RequireRole("ADMIN", "MANAGER", "OUTBOUND_STAFF", "WAREHOUSE_STAFF"));
            options.AddPolicy("AuditorAccess", policy => policy.RequireRole("ADMIN", "MANAGER", "AUDITOR"));
            options.AddPolicy("WarehouseStaff", policy => policy.RequireRole("ADMIN", "MANAGER", "INBOUND_STAFF", "OUTBOUND_STAFF", "AUDITOR", "WAREHOUSE_STAFF"));
        });

        return services;
    }
}
