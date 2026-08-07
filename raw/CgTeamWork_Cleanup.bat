@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: UAC 自我提升
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

set TARGET=C:\CgTeamWork_v7

:MENU
cls
echo ============================================
echo   CgTeamWork_v7 檢查 / 移除工具
echo   目標路徑: %TARGET%
echo ============================================
echo.

:: 檢查資料夾
if exist "%TARGET%" (
    echo [資料夾] 存在
) else (
    echo [資料夾] 不存在
)
echo.

:: 列出執行中的程序
echo [執行中的程序]
echo --------------------------------------------
set FOUND=0
for /f "skip=1 tokens=1,2 delims=," %%A in ('wmic process where "ExecutablePath like '%%CgTeamWork%%' or ExecutablePath like '%%cgtw%%'" get Name^,ProcessId /format:csv 2^>nul') do (
    if not "%%B"=="" (
        echo   PID %%B  -  %%A
        set FOUND=1
    )
)
if !FOUND!==0 echo   (無)
echo --------------------------------------------
echo.
echo   1. 強制結束所有相關程序
echo   2. 刪除整個資料夾 %TARGET%
echo   3. 結束程序 + 刪除資料夾
echo   4. 重新整理
echo   0. 離開
echo.
set /p CHOICE=請選擇:

if "%CHOICE%"=="1" goto KILL
if "%CHOICE%"=="2" goto DEL
if "%CHOICE%"=="3" goto BOTH
if "%CHOICE%"=="4" goto MENU
if "%CHOICE%"=="0" exit /b
goto MENU

:KILL
call :DOKILL
pause
goto MENU

:DEL
call :DODEL
pause
goto MENU

:BOTH
call :DOKILL
timeout /t 2 /nobreak >nul
call :DODEL
pause
goto MENU

:DOKILL
echo.
echo 正在結束程序...
for /f "skip=1" %%P in ('wmic process where "ExecutablePath like '%%CgTeamWork%%' or ExecutablePath like '%%cgtw%%'" get ProcessId 2^>nul') do (
    if not "%%P"=="" (
        taskkill /f /pid %%P /t >nul 2>&1
        if !errorlevel!==0 (echo   已結束 PID %%P) else (echo   無法結束 PID %%P)
    )
)
echo 完成。
exit /b

:DODEL
echo.
if not exist "%TARGET%" (
    echo 資料夾不存在，略過。
    exit /b
)
echo 正在刪除 %TARGET% ...
rmdir /s /q "%TARGET%" 2>nul
if exist "%TARGET%" (
    echo   刪除失敗，可能仍有檔案被鎖定。
) else (
    echo   已刪除。
)
exit /b
