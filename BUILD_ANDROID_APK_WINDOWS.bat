@echo off
setlocal
cd /d "%~dp0frontend"
echo.
echo SmartGrowth - bundled Android APK build
echo Requires Node.js 22+, Android SDK, Java 21 and Gradle Android tools.
echo If you do NOT have the Android SDK, use GitHub Actions - see docs/SUBMISSION_AND_BUILD.md.
echo.
call npm install --legacy-peer-deps
if errorlevel 1 (echo npm install failed.&pause&exit /b 1)
call npm run build
if errorlevel 1 (echo React build failed.&pause&exit /b 1)
if not exist android (
 call npx cap add android
 if errorlevel 1 (echo Unable to create native Android project.&pause&exit /b 1)
)
call npx cap sync android
if errorlevel 1 (echo Capacitor sync failed.&pause&exit /b 1)
cd android
call gradlew.bat assembleDebug
if errorlevel 1 (echo Android SDK or Gradle build failed. Use GitHub Actions instead.&pause&exit /b 1)
echo.
echo APK created at frontend\android\app\build\outputs\apk\debug\app-debug.apk
pause
