@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (set "PY=py -3") else (set "PY=python")
set "SMARTGROWTH_SEED_DEMO=1"
echo [SmartGrowth] Local test accounts enabled. Never enable these on a public server.
echo [SmartGrowth] Preparing FastAPI backend...
%PY% -m pip install -r backend\requirements.txt
if errorlevel 1 (echo Python dependency installation failed.&pause&exit /b 1)
echo [SmartGrowth] Preparing React frontend...
pushd frontend
if not exist node_modules\react-scripts\bin\react-scripts.js (
 call npm install
 if errorlevel 1 (echo npm installation failed.&pause&exit /b 1)
)
if not exist node_modules\@capacitor\core\package.json (
 call npm install
 if errorlevel 1 (echo Capacitor installation failed.&pause&exit /b 1)
)
popd
start "SmartGrowth API - port 8000" /D "%~dp0backend" cmd /k %PY% -m uvicorn main:app --host 127.0.0.1 --port 8000
start "SmartGrowth React - port 3501" /D "%~dp0frontend" cmd /k npm start
echo.
echo Once both servers start, open http://localhost:3501
echo Test login: demo@smartgrowth.local / SmartDemo!2026
pause
