# Nexora Enterprise Platform - PowerShell Launcher
$ErrorActionPreference = "Stop"

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "                NEXORA ENTERPRISE PLATFORM LAUNCHER                   " -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$javaCmd = "java"
try {
    $null = Get-Command java -ErrorAction Stop
} catch {
    if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
        $javaCmd = "$env:JAVA_HOME\bin\java.exe"
    } elseif (Test-Path "C:\Users\HP\.p2\pool\plugins\org.eclipse.justj.openjdk.hotspot.jre.full.win32.x86_64_21.0.12.v20260826-1216\jre\bin\java.exe") {
        $javaCmd = "C:\Users\HP\.p2\pool\plugins\org.eclipse.justj.openjdk.hotspot.jre.full.win32.x86_64_21.0.12.v20260826-1216\jre\bin\java.exe"
    } else {
        Write-Error "Java 17+ was not found on your system PATH or standard directories. Please install Java 17+ or set JAVA_HOME."
        exit 1
    }
}

$jarPath = Join-Path $PSScriptRoot "backend\target\nexora-backend-1.0.0.jar"
if (-not (Test-Path $jarPath)) {
    Write-Error "Jar artifact not found at: $jarPath. Run 'mvn package -DskipTests' in backend folder first."
    exit 1
}

Write-Host "Starting Nexora Full-Stack Enterprise Platform..." -ForegroundColor Green
Write-Host "URL: http://localhost:8080" -ForegroundColor Green
Write-Host ""
Write-Host "Demo Accounts:" -ForegroundColor Cyan
Write-Host "  - Admin:           admin@nexora.com  / admin123"
Write-Host "  - Project Manager: pm@nexora.com     / pm123"
Write-Host "  - Client:          client@nexora.com / client123"
Write-Host "  - Team Member:     member@nexora.com / member123"
Write-Host ""
Write-Host "Press Ctrl+C in this console to stop the platform." -ForegroundColor Gray
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

& $javaCmd -jar $jarPath
