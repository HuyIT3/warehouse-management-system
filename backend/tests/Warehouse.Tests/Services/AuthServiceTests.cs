using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Moq;
using Warehouse.Application.DTOs.Auth;
using Warehouse.Application.Exceptions;
using Warehouse.Application.Interfaces;
using Warehouse.Application.Services;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Infrastructure.Data;

namespace Warehouse.Tests.Services;

public class AuthServiceTests
{
    private WarehouseDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<WarehouseDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new WarehouseDbContext(options);
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ShouldReturnJwtToken()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var passwordHasherMock = new Mock<IPasswordHasher>();
        var jwtTokenServiceMock = new Mock<IJwtTokenService>();
        var currentUserServiceMock = new Mock<ICurrentUserService>();

        var user = new User
        {
            Id = 1,
            Username = "admin",
            PasswordHash = "hashed_pw",
            FullName = "Admin User",
            Role = UserRole.ADMIN,
            IsActive = true
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        passwordHasherMock.Setup(p => p.VerifyPassword("Admin@123", "hashed_pw")).Returns(true);
        jwtTokenServiceMock.Setup(j => j.GenerateToken(It.IsAny<User>())).Returns("mock_jwt_token_123");

        var authService = new AuthService(context, passwordHasherMock.Object, jwtTokenServiceMock.Object, currentUserServiceMock.Object);

        var request = new LoginRequest
        {
            Username = "admin",
            Password = "Admin@123"
        };

        // Act
        var result = await authService.LoginAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Token.Should().Be("mock_jwt_token_123");
        result.User.Username.Should().Be("admin");
        result.User.Role.Should().Be(UserRole.ADMIN);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ShouldThrowUnauthorizedException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var passwordHasherMock = new Mock<IPasswordHasher>();
        var jwtTokenServiceMock = new Mock<IJwtTokenService>();
        var currentUserServiceMock = new Mock<ICurrentUserService>();

        var user = new User
        {
            Id = 1,
            Username = "admin",
            PasswordHash = "hashed_pw",
            FullName = "Admin User",
            Role = UserRole.ADMIN,
            IsActive = true
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        passwordHasherMock.Setup(p => p.VerifyPassword("WrongPassword", "hashed_pw")).Returns(false);

        var authService = new AuthService(context, passwordHasherMock.Object, jwtTokenServiceMock.Object, currentUserServiceMock.Object);

        var request = new LoginRequest
        {
            Username = "admin",
            Password = "WrongPassword"
        };

        // Act & Assert
        var act = async () => await authService.LoginAsync(request);
        await act.Should().ThrowAsync<UnauthorizedException>();
    }
}
