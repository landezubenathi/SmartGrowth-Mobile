@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (set "PY=py -3") else (set "PY=python")
echo Running SmartGrowth backend tests...
%PY% -m unittest discover -s tests -v
if errorlevel 1 (echo Tests failed.&pause&exit /b 1)
echo.
echo Checking React and Capacitor install...
if not exist frontend\node_modules\react-scripts\bin\react-scripts.js (
 echo Frontend dependencies not installed. Start START_SMARTGROWTH_WINDOWS.bat first.
) else (
 pushd frontend
 call npm run build
 popd
)
pause
