@echo off
setlocal
cd /d "%~dp0frontend"
echo Building SmartGrowth web assets...
call npm install
if errorlevel 1 (echo Dependency installation failed.&pause&exit /b 1)
call npm run build
if errorlevel 1 (echo React build failed.&pause&exit /b 1)
if not exist android (
 call npx cap add android
 if errorlevel 1 (echo Android project generation failed.&pause&exit /b 1)
)
call npx cap sync android
if errorlevel 1 (echo Capacitor sync failed.&pause&exit /b 1)
echo.
echo Ready. To open Android Studio, use: npx cap open android
pause
