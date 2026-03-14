@echo off
echo ========================================
echo Metro Bundler Error Fix Script
echo ========================================
echo.
echo This script will:
echo 1. Clear Metro bundler cache
echo 2. Clear Expo cache
echo 3. Restart the development server
echo.
pause

echo.
echo [1/3] Clearing Metro bundler cache...
call npx expo start -c --clear

echo.
echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo Your app should now start without errors.
echo If you still see issues, try the full clean:
echo   1. Close this window
echo   2. Run: full-clean.bat
echo.
pause
