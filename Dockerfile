# Multi-stage build for ASP.NET Core Web API (Root Context)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["backend/src/Warehouse.Domain/Warehouse.Domain.csproj", "backend/src/Warehouse.Domain/"]
COPY ["backend/src/Warehouse.Application/Warehouse.Application.csproj", "backend/src/Warehouse.Application/"]
COPY ["backend/src/Warehouse.Infrastructure/Warehouse.Infrastructure.csproj", "backend/src/Warehouse.Infrastructure/"]
COPY ["backend/src/Warehouse.Api/Warehouse.Api.csproj", "backend/src/Warehouse.Api/"]

RUN dotnet restore "backend/src/Warehouse.Api/Warehouse.Api.csproj"

# Copy full backend source code and build release
COPY backend/ backend/
WORKDIR "/src/backend/src/Warehouse.Api"
RUN dotnet build "Warehouse.Api.csproj" -c Release -o /app/build
RUN dotnet publish "Warehouse.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000;http://+:10000;http://+:80
EXPOSE 5000 10000 80

ENTRYPOINT ["dotnet", "Warehouse.Api.dll"]
