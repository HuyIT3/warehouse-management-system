@echo off
title Warehouse Management System (WMS) - Local Launcher
echo ===================================================
echo   KHOI DONG HE THONG QUAN LY KHO WMS (LOCAL DEV)
echo ===================================================

:: Set custom .NET SDK & NuGet paths if needed
set PATH=d:\CSDL\dotnet;%PATH%
set DOTNET_ROOT=d:\CSDL\dotnet
set NUGET_PACKAGES=d:\CSDL\nuget_packages

echo.
echo [1/2] Dang khoi dong Backend Web API (http://localhost:5000)...
start "WMS Backend API" cmd /k "cd /d "%~dp0backend\src\Warehouse.Api" && dotnet run --urls "http://localhost:5000""

echo.
echo [2/2] Dang khoi dong Frontend React (http://localhost:5173)...
start "WMS Frontend React" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --port 5173 --host"

echo.
echo ===================================================
echo   HE THONG DA SAN SANG:
echo   - Ung dung Web:    http://localhost:5173
echo   - Swagger API:     http://localhost:5000/swagger
echo ===================================================
timeout /t 5
start http://localhost:5173
