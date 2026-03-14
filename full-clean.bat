@echo off
echo ========================================
echo Full Clean and Reinstall Script
echo ========================================
echo.
echo WARNING: This will delete node_modules and reinstall all dependencies.
echo This may take several minutes.
echo.
pause

echo.
echo [1/5] Removing node_modules...
if exist node_modules rmdir /s /q node_modules

echo [2/5] Removing .expo cache...
if exist .expo rmdir /s /q .expo

echo [3/5] Removing package-lock.json...
if exist package-lock.json del /f /q package-lock.json

echo [4/5] Installing dependencies...
call npm install

echo [5/5] Starting Expo with cleared cache...
call npx expo start -c

echo.
echo ========================================
echo Full Clean Complete!
echo ========================================
pause
