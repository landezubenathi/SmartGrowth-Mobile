@echo off
setlocal
cd /d "%~dp0frontend"
echo Starting SmartGrowth standalone web mode...
echo This does NOT require the FastAPI backend.
if not exist "node_modules\@capacitor\core" (
  echo Installing React and Capacitor dependencies (first use only)...
  call npm install --legacy-peer-deps
  if errorlevel 1 (echo npm installation failed.&pause&exit /b 1)
)
set PORT=3501
call npm start
pause
