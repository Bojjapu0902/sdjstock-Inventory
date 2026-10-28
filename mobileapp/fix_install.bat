@echo off
echo ============================================
echo  SDJ Marine Mobile App - Clean Install
echo ============================================
echo.

cd /d "C:\xampp\htdocs\Websites\sdjstock-Inventory_new\mobileapp"

echo [1/5] Removing node_modules...
if exist node_modules (rmdir /s /q node_modules && echo Done.) else (echo Skipped.)

echo.
echo [2/5] Removing package-lock.json...
if exist package-lock.json (del package-lock.json && echo Done.) else (echo Skipped.)

echo.
echo [3/5] Installing expo first...
call npm install expo@~58.0.19 --force
echo.

echo [4/5] Installing all packages...
call npm install --force
echo.

echo [5/5] Checking expo is ready...
call npx expo --version

echo.
if %errorlevel% == 0 (
    echo ============================================
    echo  SUCCESS! Now starting the app...
    echo ============================================
    echo.
    call npx expo start
) else (
    echo ============================================
    echo  Install done. Run: npx expo start
    echo ============================================
)
pause
