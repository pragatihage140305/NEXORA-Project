@echo off
setlocal enabledelayedexpansion

echo =====================================================================
echo                NEXORA ENTERPRISE PLATFORM LAUNCHER                   
echo =====================================================================
echo.

:: Detect Java executable
set "JAVA_CMD=java"
where java >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if defined JAVA_HOME (
        set "JAVA_CMD=%JAVA_HOME%\bin\java.exe"
    ) else if exist "C:\Users\HP\.p2\pool\plugins\org.eclipse.justj.openjdk.hotspot.jre.full.win32.x86_64_21.0.12.v20260826-1216\jre\bin\java.exe" (
        set "JAVA_CMD=C:\Users\HP\.p2\pool\plugins\org.eclipse.justj.openjdk.hotspot.jre.full.win32.x86_64_21.0.12.v20260826-1216\jre\bin\java.exe"
    ) else (
        echo [ERROR] Java 17+ was not found on your system PATH or in standard directories.
        echo Please ensure Java 17 or Java 21 is installed.
        pause
        exit /b 1
    )
)

set "JAR_PATH=%~dp0backend\target\nexora-backend-1.0.0.jar"
if not exist "%JAR_PATH%" (
    echo [ERROR] Jar artifact not found at: %JAR_PATH%
    echo Please build the project first using: cd backend && mvn package -DskipTests
    pause
    exit /b 1
)

echo Starting Nexora Full-Stack Enterprise Platform...
echo URL: http://localhost:8080
echo.
echo Demo Accounts:
echo   - Admin:          admin@nexora.com  / admin123
echo   - Project Manager: pm@nexora.com    / pm123
echo   - Client:         client@nexora.com / client123
echo   - Team Member:    member@nexora.com / member123
echo.
echo Press Ctrl+C in this console to stop the platform.
echo =====================================================================
echo.

"%JAVA_CMD%" -jar "%JAR_PATH%"
