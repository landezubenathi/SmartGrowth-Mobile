@echo off
setlocal
cd /d "%~dp0frontend"
call npm install --legacy-peer-deps
if errorlevel 1 (echo npm install failed.&pause&exit /b 1)
call npm run build
if errorlevel 1 (echo Production web build failed.&pause&exit /b 1)
echo.
echo SUCCESS. Deploy everything inside frontend\build to an HTTPS static host.
echo The On-device demo works without FastAPI. On an installed PWA, open once online before testing offline.
pause
