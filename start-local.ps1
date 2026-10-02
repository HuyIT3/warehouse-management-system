# Script khởi chạy hệ thống WMS trên máy Local
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  KHỞI ĐỘNG HỆ THỐNG QUẢN LÝ KHO WMS (LOCAL DEV)  " -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Cyan

$env:PATH = "d:\CSDL\dotnet;$env:PATH"
$env:DOTNET_ROOT = "d:\CSDL\dotnet"
$env:NUGET_PACKAGES = "d:\CSDL\nuget_packages"

Write-Host "`n[1/2] Đang khởi chạy Backend Web API (.NET 8)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = 'd:\CSDL\dotnet;' + `$env:PATH; `$env:DOTNET_ROOT = 'd:\CSDL\dotnet'; `$env:NUGET_PACKAGES = 'd:\CSDL\nuget_packages'; Set-Location '$PSScriptRoot\backend\src\Warehouse.Api'; dotnet run --urls 'http://localhost:5000'"

Write-Host "[2/2] Đang khởi chạy Frontend React (Vite)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; npm run dev -- --port 5173 --host"

Write-Host "`n===================================================" -ForegroundColor Cyan
Write-Host "  HỆ THỐNG ĐÃ KHỞI ĐỘNG THÀNH CÔNG!" -ForegroundColor Green
Write-Host "  - Ứng dụng Web:   http://localhost:5173" -ForegroundColor Yellow
Write-Host "  - Swagger API:    http://localhost:5000/swagger" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Cyan

Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"
