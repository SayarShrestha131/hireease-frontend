@echo off
cls
echo ========================================
echo Starting Expo with Debug Logging
echo ========================================
echo.
echo Watch for these log messages:
echo   🟢 = Success (green circle)
echo   🔴 = Error (red circle)
echo.
echo The LAST 🟢 message before any error
echo will tell us exactly what's wrong.
echo.
echo ========================================
echo.
pause

echo Starting Expo...
echo.
npx expo start -c

pause
