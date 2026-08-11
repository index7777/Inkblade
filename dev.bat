@echo off
chcp 65001 >nul
title Inkblade Dev Menu
cd /d "%~dp0"

:menu
cls
echo ==================================
echo    墨劍訣 Inkblade  開發選單
echo ==================================
echo   1  安裝相依        npm install
echo   2  建置一次        npm run build
echo   3  監看自動重建    npm run watch
echo   4  線上測試        npm run serve  ^(自動開瀏覽器^)
echo   5  語法檢查        npm run check
echo   6  建置並開離線    build 後開 inkblade.html
echo   0  離開
echo ==================================
set /p "choice=請輸入 0-6 後按 Enter： "

if "%choice%"=="1" goto c_install
if "%choice%"=="2" goto c_build
if "%choice%"=="3" goto c_watch
if "%choice%"=="4" goto c_serve
if "%choice%"=="5" goto c_check
if "%choice%"=="6" goto c_offline
if "%choice%"=="0" goto end
goto menu

:c_install
echo.
echo === npm install ===
call npm install
echo.
pause
goto menu

:c_build
echo.
echo === npm run build ===
call npm run build
echo.
pause
goto menu

:c_watch
echo.
echo === npm run watch ^(改 src 自動重建；按 Ctrl+C 結束回選單^) ===
call npm run watch
goto menu

:c_serve
echo.
echo === npm run serve ^(http://localhost:8080/ ；按 Ctrl+C 結束回選單^) ===
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:8080/inkblade.html'"
call npm run serve
goto menu

:c_check
echo.
echo === npm run check ===
call npm run check
echo.
pause
goto menu

:c_offline
echo.
echo === build 後開離線 inkblade.html ===
call npm run build
start "" "%~dp0inkblade.html"
echo.
pause
goto menu

:end
