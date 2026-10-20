@echo off
setlocal
cd /d "%~dp0frontend"
where npm >nul 2>&1 || (echo ERROR: Node.js/npm not found. Install Node.js 22+. & pause & exit /b 1)
where firebase >nul 2>&1 || (echo ERROR: Firebase CLI missing. Run: npm install -g firebase-tools & pause & exit /b 1)
if not exist firebase.json (
  echo ERROR: Firebase Hosting configuration is missing from the frontend folder.
  echo Run: firebase init hosting
  echo Public directory: build, Single-page app: Yes, Don't overwrite build/index.html.
  pause
  exit /b 1
)
if not exist node_modules\react-scripts (
  echo Installing frontend dependencies for this computer...
  call npm install --no-audit --no-fund --legacy-peer-deps || (pause & exit /b 1)
)
echo Building updated SmartGrowth web app...
call npm run build || (echo BUILD FAILED; nothing was deployed. & pause & exit /b 1)
echo Deploying to Firebase Hosting project smartgrowthmobile...
call firebase deploy --only hosting --project smartgrowthmobile || (echo DEPLOY FAILED. Check Firebase login and Hosting permissions. & pause & exit /b 1)
echo.
echo Website published. Check your Firebase Hosting URL.
echo The Android APK is NOT updated by this deployment.
pause
