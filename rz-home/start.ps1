# ============================================================
# Rz家居 一键启动脚本（Windows PowerShell）
# 用法：右键"使用 PowerShell 运行"，或  powershell -ExecutionPolicy Bypass -File start.ps1
# 启动：后端 FastAPI(:8000) + 前台 Vite(:5173) + 后台 preview(:5174)
# 说明：后台需先构建（npm run build）；本机 npm run dev 会触发 safe-delete 崩溃，故后台用 preview。
# ============================================================
$root = $PSScriptRoot

if (-not (Test-Path "$root\backend\venv\Scripts\python.exe")) {
    Write-Host "[错误] 未找到后端虚拟环境 backend\venv，请先创建：" -ForegroundColor Red
    Write-Host "  cd backend && python -m venv venv && venv\Scripts\pip install -r requirements.txt"
    exit 1
}
if (-not (Test-Path "$root\frontend\admin\dist\index.html")) {
    Write-Host "[提示] 后台尚未构建，先执行构建（约 1 分钟）..." -ForegroundColor Yellow
    Push-Location "$root\frontend\admin"
    npm run build
    Pop-Location
    if (-not $?) { Write-Host "[错误] 后台构建失败" -ForegroundColor Red; exit 1 }
}

Write-Host ""
Write-Host "==> 启动后端 FastAPI :8000" -ForegroundColor Cyan
Push-Location "$root\backend"
$env:ENV = "dev"
Start-Process -FilePath ".\venv\Scripts\python.exe" -ArgumentList "-m","uvicorn","app.main:app","--port","8000" -WorkingDirectory (Get-Location) -WindowStyle Minimized
Pop-Location

Write-Host "==> 启动前台 Vite :5173" -ForegroundColor Cyan
Push-Location "$root\frontend\web"
Start-Process -FilePath "npm.cmd" -ArgumentList "run","dev" -WorkingDirectory (Get-Location) -WindowStyle Minimized
Pop-Location

Write-Host "==> 启动后台 preview :5174" -ForegroundColor Cyan
Push-Location "$root\frontend\admin"
Start-Process -FilePath "npm.cmd" -ArgumentList "run","preview","--","--port","5174","--strictPort" -WorkingDirectory (Get-Location) -WindowStyle Minimized
Pop-Location

Start-Sleep -Seconds 6
Write-Host ""
Write-Host "==============================" -ForegroundColor Green
Write-Host "  访问地址：" -ForegroundColor Green
Write-Host "    前台官网 : http://localhost:5173" -ForegroundColor Green
Write-Host "    后台管理 : http://localhost:5174   (admin/admin123)" -ForegroundColor Green
Write-Host "    API 文档 : http://localhost:8000/docs" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
Write-Host "（三个窗口以最小化方式运行，关闭对应窗口即停止该服务）"
