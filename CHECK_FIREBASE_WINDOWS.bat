@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js is required. Install Node.js 22 or newer.
 pause
 exit /b 1
)
node scripts\verify_firebase_config.mjs
if errorlevel 1 (
 echo Firebase setup needs attention. See docs\SMARTGROWTHMOBILE_FIREBASE_CONNECTED.md
 pause
 exit /b 1
)
echo Your local React build will use the SmartGrowthMobile Firebase project.
pause
