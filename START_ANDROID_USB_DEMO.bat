@echo off
setlocal
cd /d "%~dp0"
echo Start the SmartGrowth Windows backend and frontend first.
echo Connect your Android phone by USB with USB debugging enabled.
echo.
where adb >nul 2>nul
if errorlevel 1 (
 echo ADB is not in PATH. Open this BAT from a terminal with Android Platform-Tools configured.
 echo Or execute: C:\platform-tools\adb.exe reverse tcp:3501 tcp:3501
 echo             C:\platform-tools\adb.exe reverse tcp:8000 tcp:8000
 pause
 exit /b 1
)
adb devices
adb reverse tcp:3501 tcp:3501
adb reverse tcp:8000 tcp:8000
echo.
echo On your Android phone, open Chrome: http://localhost:3501
pause
