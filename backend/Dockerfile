# Multi-stage build for ASP.NET Core Web API
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["src/Warehouse.Domain/Warehouse.Domain.csproj", "src/Warehouse.Domain/"]
COPY ["src/Warehouse.Application/Warehouse.Application.csproj", "src/Warehouse.Application/"]
COPY ["src/Warehouse.Infrastructure/Warehouse.Infrastructure.csproj", "src/Warehouse.Infrastructure/"]
COPY ["src/Warehouse.Api/Warehouse.Api.csproj", "src/Warehouse.Api/"]

RUN dotnet restore "src/Warehouse.Api/Warehouse.Api.csproj"

# Copy source code and build release
COPY . .
WORKDIR "/src/src/Warehouse.Api"
RUN dotnet build "Warehouse.Api.csproj" -c Release -o /app/build
RUN dotnet publish "Warehouse.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "Warehouse.Api.dll"]
