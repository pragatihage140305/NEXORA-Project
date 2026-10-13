```bat
@echo off
title NEXORA Enterprise Platform
color 0A

cd /d "%~dp0"

echo ==========================================
echo    STARTING NEXORA ENTERPRISE PLATFORM
echo ==========================================
echo.

echo Checking Java installation...
java -version

if errorlevel 1 (
    echo ERROR: Java is not available in PATH.
    pause
    exit /b 1
)

if not exist "backend\target\nexora-backend-1.0.0.jar" (
    echo ERROR: Backend JAR file not found.
    echo Please check the backend\target folder.
    pause
    exit /b 1
)

echo.
echo Starting NEXORA backend...
echo Open http://localhost:8080 in your browser.
echo.

java -jar "backend\target\nexora-backend-1.0.0.jar"

pause
```